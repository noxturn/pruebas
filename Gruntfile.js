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
        if (arreglodesubcadenas[arreglodesubcadenas.length - 1] == '') {
            arreglodesubcadenas.pop()
        }
        var shops = grunt.file.readYAML('config.yml')
        for (const shop in shops) {
            var nameShopynameTheme = shop.split('-')
            var cadenaFicheros = ''
            for (i = 0; i < arreglodesubcadenas.length; i++) {
                arreglodesubcadenas[i] = arreglodesubcadenas[i].replace(
                    'shops/',
                    ''
                )
                if (
                    arreglodesubcadenas[i].indexOf(
                        nameShopynameTheme[0] + '/' + nameShopynameTheme[1]
                    ) !== -1
                ) {
                    cadenaFicheros =
                        cadenaFicheros +
                        arreglodesubcadenas[i].replace(
                            nameShopynameTheme[0] + '/',
                            ''
                        ) +
                        ' '
                }
            }
            if (cadenaFicheros !== '') {
                //console.log('tienda: ' + shop + ' ' + cadenaFicheros)
                grunt.task.run(
                    'shell:test2:' +
                        'cd shops/' +
                        nameShopynameTheme[0] +
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
            test3: {
                command: tienda =>
                    `./node_modules/.bin/theme-lint shops/${tienda}/`,
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
        var result
        for (const shop in shops) {
            result = ''
            var nameShopynameTheme = shop.split('-')
            if (
                grunt.file.exists(
                    'shops/' + nameShopynameTheme[0] + '/config.yml'
                )
            ) {
                result += grunt.file.read(
                    'shops/' + nameShopynameTheme[0] + '/config.yml'
                )
            } else result = ''
            grunt.file.write(
                'shops/' + nameShopynameTheme[0] + '/config.yml',
                result +
                    '\n' +
                    nameShopynameTheme[1] +
                    ':\n  password: ' +
                    shops[shop].password +
                    '\n  theme_id: ' +
                    shops[shop].theme_id +
                    '\n  store: ' +
                    shops[shop].store
            )
        }
    })
    grunt.registerTask('theme-lint', function() {
        var shops = grunt.file.readYAML('config.yml')
        for (const shop in shops) {
            grunt.task.run('shell:test3:' + shop.replace('-', '/'))
        }
    })
}
