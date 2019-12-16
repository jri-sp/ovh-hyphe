
const conf = require('./conf.json');
const pkgcloud = require('pkgcloud');
const fs = require('fs');
const request = require('request');

const authInfo = {
    provider: 'openstack', // required
    username: conf.username, // required
    password: conf.password, // required
    tenantId: conf.tenantId,
    region: conf.regions.Gravelines,
    authUrl: conf.authUrl // required
  };

const createHypheServer = (openstack, done) => {
  // first chose a flavor
  openstack.getFlavors((err,_flavors) => {
    if(err) {
      console.log(err);
      done(err)
    }
    const flavors = {}
    let flavors_csv = 'name,RAM,disk,vCPUs,id\n'
    _flavors.forEach(f => {
      flavors_csv += [f.name, `${f.ram/1000} Go`, `${f.disk} Go`, `${f.vcpus} CPUs`, f.id].join(",")+'\n';
      flavors[f.name] = f
    });
    flavor = flavors[conf.flavor_name]
    if (flavor) {
      console.log(`you chose flavor ${flavor.name} with ${flavor.ram/1000} Go ram, ${flavor.disk} Go SSD, ${flavor.vcpus} CPUs with id: ${flavor.id}`)
      // now chose an image
      openstack.getImages((err, _images)=> {
        if(err) {
          console.log(err);
          done(err)
        }
        const images = {}
        _images.forEach(i => images[i.name] = i.id);
        image = images[conf.image_name]
        if (!image) {
          console.log("please chose an OS image in this list in the conf in image_name field:")
          console.log(images)
          done('error, image_name unkwon or missing in conf')
        }
        else {
          const label = (new Date()).toISOString()
          //prepare start script
          const start_script_b64 = Buffer.from(fs.readFileSync('./post-install.sh', encoding='utf8')).toString('base64')

          openstack.createServer({
            name: `hyphe_${label}`, // required
            flavor: flavor,  // required
            image: image,    // required
            user_data: start_script_b64,
            key_name: conf.key_name,
            personality: []     // optional
            }, (err, server => {
              if(err) {
                console.log(err);
                done(err)
              }
              // we're done, let's send the server to callback
              done(null, server) 
          }))
        }
      })


    }
    else {
      console.log(`you have to set one flavor name in the conf among this list:`);
      console.log(flavors_csv);
      done('error flavor_name missing or unknown in conf')
    }

});

};



const openstack = pkgcloud.compute.createClient(authInfo);
console.log("successfully connected to OpenStack");

// if (conf.ssh_key_pub && conf.ssh_key_pub !== '') {
//   // check key
//   request.get()
// }


openstack.getServers((err, servers) => {
  if (servers && servers.length > 0)
    servers.forEach(s => {
      console.log(s.openstack)
    })
  else {
    createHypheServer(openstack, (err, server) => {
      if (err)
        console.log(err)
      else {
        console.log("our new Hyphe server is here")
        console.log(server);
      }
    })
     
  }  
})