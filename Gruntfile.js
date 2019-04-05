// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {
    // CONFIGURE GRUNT
    function log(error, stdout, stderr, callback) {
        if (error) {
            callback(error)
            return
        }
        arreglodesubcadenas = stdout.split('\n')

        var shops = grunt.file.readYAML('config.yml')
        for (const shop in shops) {
            var cadenaFicheros = ''
            for (i = 0; i < arreglodesubcadenas.length - 1; i++) {
                arreglodesubcadenas[i] = arreglodesubcadenas[i].replace(
                    'shops/',
                    ''
                )
                if (arreglodesubcadenas[i].indexOf(shop) !== -1) {
                    cadenaFicheros =
                        cadenaFicheros +
                        arreglodesubcadenas[i].replace(shop + '/', '') +
                        ' '
                }
            }
            if (cadenaFicheros !== '') {
                //console.log('tienda: ' + shop + ' ' + cadenaFicheros)
                grunt.task.run(
                    'shell:test2:' +
                        'cd shops/' +
                        shop +
                        ' && echo theme deploy ' +
                        cadenaFicheros +
                        ' -na'
                ) //echo ' + cadenaFicheros
            }
        }

        callback()
    }
    grunt.initConfig({
        // get the configuration info from package.json file
        // this way we can use things like name and version (pkg.name)
        pkg: grunt.file.readJSON('package.json'),
        // all of our configuration goes here
        cwd: process.cwd(),

        shell: {
            test: {
                command: 'git diff HEAD^ HEAD --name-only',
                options: {
                    callback: log,
                },
                //command: ['cd shops', 'ls'].join('&&'),
            },
            test2: {
                command: hola => `${hola}`, //hola => [`cd ${shop}`, `echo ${hola}`].join('&&'),
            },
        },
        uglify: {
            // uglify task configuration
            options: {},
            build: {},
        },
    })

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-shell')

    // Default task(s).
    grunt.registerTask('default', ['uglify'])

    grunt.registerTask('prueba', ['shell:test'])

    grunt.registerTask('createYAMLFileOnEachShop', function() {
        //
        var shops = grunt.file.readYAML('config.yml')
        for (const shop in shops) {
            grunt.file.write(
                'shops/' + shop + '/config.yml',
                shop +
                    ':\n  password: ' +
                    shops[shop].password +
                    '\n  theme_id: ' +
                    shops[shop].theme_id +
                    '\n  store: ' +
                    shops[shop].store
            )
        }
    })
    grunt.registerTask('deployModifiedFilesOnEachShop', function() {
        var shops = grunt.file.readYAML('config.yml')
        for (const shop in shops) {
        }
    })
}