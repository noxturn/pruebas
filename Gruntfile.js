// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {
    // CONFIGURE GRUNT
    function carpetas(error, stdout, stderr, callback) {
        var foldersNames = stdout.split('\n')
        if (error) {
            callback(error)
            return
        }
        if (foldersNames[foldersNames.length - 1] == '') {
            foldersNames.pop()
        }
        for (i = 0; i < foldersNames.length; i++) {
            grunt.task.run('shell:prettier:' + foldersNames[i] + '/theme')
        }
        callback()
    }

    function log(error, stdout, stderr, callback) {
        if (error) {
            callback(error)
            return
        }
        arreglodesubcadenas = stdout.split('\n')
        if (arreglodesubcadenas[arreglodesubcadenas.length - 1] == '') {
            arreglodesubcadenas.pop()
        }
        var cadenaFicheros = ''
        for (i = 0; i < arreglodesubcadenas.length; i++) {
            arreglodesubcadenas[i] = arreglodesubcadenas[i].replace(
                'shops/',
                ''
            )
            shop = arreglodesubcadenas[i].replace(/\/.*/, '')
            fileNameRoute = arreglodesubcadenas[i].replace(/[^\/]*[\/]/, '')
            theme = fileNameRoute.replace(/[\/].*/, '')
            fileNameRoute = fileNameRoute.replace(/[^\/]*[\/]/, '')
            cadenaFicheros = cadenaFicheros + fileNameRoute
        }
        if (cadenaFicheros !== '') {
            grunt.task.run(
                'shell:deploy:' +
                    'cd shops/' +
                    shop +
                    '/' +
                    theme +
                    ' && echo theme deploy ' +
                    cadenaFicheros +
                    ' -na'
            )
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
            modifiedFilesBetweenCommits: {
                command: 'git diff HEAD^ HEAD --name-only',
                options: {
                    callback: log,
                },
            },
            deploy: {
                command: fulldeploycommand => `${fulldeploycommand}`,
            },
            prettier: {
                command: tienda =>
                    `./node_modules/.bin/theme-lint shops/${tienda}/`,
            },
            carpetas: {
                command: 'ls shops',
                options: {
                    callback: carpetas,
                },
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

    grunt.registerTask('prueba', ['shell:modifiedFilesBetweenCommits'])

    grunt.registerTask('createYAMLFileOnEachShop', function() {
        //
        var shops = grunt.file.readYAML('config.yml')
        var result
        for (const shop in shops) {
            result = ''
            var nameShopynameTheme = shop.split('-')
            if (
                grunt.file.exists(
                    'shops/' +
                        nameShopynameTheme[0] +
                        '/' +
                        nameShopynameTheme[1] +
                        '/config.yml'
                )
            ) {
                result += grunt.file.read(
                    'shops/' +
                        nameShopynameTheme[0] +
                        '/' +
                        nameShopynameTheme[1] +
                        '/config.yml'
                )
            } else result = ''
            grunt.file.write(
                'shops/' +
                    nameShopynameTheme[0] +
                    '/' +
                    nameShopynameTheme[1] +
                    '/config.yml',
                result +
                    '\n' +
                    nameShopynameTheme[2] +
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
        grunt.task.run('shell:carpetas')
    })
}
