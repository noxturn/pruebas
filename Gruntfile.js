// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {
    function comparar(error, stdout, stderr, callback) {
        if (error) {
            callback(error)
            return
        }
        var idCommit = stdout
        archivos = grunt.file.read('archivo.txt')
        grunt.task.run(
            'shell:crearRama:temporal:' + idCommit,
            'shell:status',
            'shell:crearRama:Shopify'
        )

        console.log(archivos)

        callback()
    }
    // Fn para conseguir los nombres de las carpetas dentro de shops
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
    //Fn para hacer el deploy de los ficheros modificados
    function log(error, stdout, stderr, callback) {
        //console.log(process.env.TRAVIS_BRANCH)
        if (error) {
            callback(error)
            return
        }
        arreglodesubcadenas = stdout.split('\n')
        if (arreglodesubcadenas[arreglodesubcadenas.length - 1] == '') {
            arreglodesubcadenas.pop()
        }
        for (i = 0; i < arreglodesubcadenas.length; i++) {
            cadena = arreglodesubcadenas[i]
            if (!cadena.startsWith('shops')) {
                arreglodesubcadenas = arreglodesubcadenas.splice(i + 1, 1)
            }
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
            //if(process.env.TRAVIS_BRANCH=='ricardo')enviroment=
            grunt.task.run(
                'shell:deploy:' +
                    'cd shops/' +
                    shop +
                    '/' +
                    theme +
                    ' && echo theme deploy ' +
                    cadenaFicheros +
                    ' -n --env=' +
                    process.env.TRAVIS_BRANCH
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
            crearRama: {
                command: function(rama, commit) {
                    return `git checkout -b ${rama} ${commit}`
                },
            },
            uglify: {
                // uglify task configuration
                options: {},
                build: {},
            },
            commit: {
                command: 'git rev-parse HEAD~1',
                options: {
                    callback: comparar,
                },
            },
            status: {
                command: 'git status',
            },
        },
    })

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-shell')

    // Default task(s).
    grunt.registerTask('default', ['uglify'])
    grunt.registerTask('deploy', ['shell:modifiedFilesBetweenCommits'])

    //Tarea para crear los ficheros YAML en cada tienda/theme
    grunt.registerTask('createYAMLFileOnEachShop', function() {
        //
        var shops = grunt.file.readYAML('config.yml')
        var result
        for (const shop in shops) {
            result = ''
            for (const entorno in shops[shop]) {
                //console.log(shops[shop][entorno].password)

                if (
                    grunt.file.exists(
                        'shops/' + shop + '/' + 'theme/config.yml'
                    )
                ) {
                    result += grunt.file.read(
                        'shops/' + shop + '/' + 'theme/config.yml'
                    )
                } else result = ''
                grunt.file.write(
                    'shops/' + shop + '/' + 'theme/config.yml',
                    result +
                        '\n' +
                        entorno +
                        ':\n  password: ' +
                        shops[shop][entorno].password +
                        '\n  theme_id: ' +
                        shops[shop][entorno].theme_id +
                        '\n  store: ' +
                        shops[shop][entorno].store
                )
            }
        }
    })
    grunt.registerTask('theme-lint', function() {
        grunt.task.run('shell:carpetas')
    })
}
