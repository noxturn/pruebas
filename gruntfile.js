module.exports = grunt => {
    grunt.loadNpmTasks('grunt-shell')
    grunt.initConfig({
        shell: {
            theme_lint: {
                command: shop => `./node_modules/.bin/theme-lint shops/${shop}/` //try to do this with a npm script
            },
            git_commits_difference: {
                command: 'git diff HEAD^ HEAD --name-only >> changed_files.txt'
            }
        },
    })
    grunt.registerTask('default', ['shell'])
    grunt.registerTask('setShopsConfig', function() { //try to reduce all the loops
        var shops = grunt.file.readYAML('config.yml');
        var configArray = [];
        var configString = '';
        for (let shop in shops) {
            
            for (let env in shops[shop]) {
                configString += env

                for (let attr in shops[shop][env]) {
                    if (attr == 'ignore_files') {
                        configString += '\n  ' + attr + ':';

                        for (let file in shops[shop][env][attr]) {
                            if (shops[shop][env][attr][file].startsWith('*')) {
                                configString += ' \n    - "' + shops[shop][env][attr][file] + '"';
                            } else {
                                configString += ' \n    - ' + shops[shop][env][attr][file];
                            }
                        }
                    } else {
                        configString += '\n  ' + attr + ': ' + shops[shop][env][attr];
                    }
                }

                configString += '\n';
            }

            configArray[shop] = configString;
            grunt.file.write(`shops/${Object.keys(configArray)[0]}/config.yml`,configArray[shop]);

            configArray = [];
            configString = '';
        }
    })
    grunt.registerTask('theme-lint', function() {
        var shops = grunt.file.readYAML('config.yml');
        for (let shop in shops) {
            grunt.task.run('shell:theme_lint:' + shop);
        }
    })
    grunt.registerTask('setFilesToUpload', function() {
        grunt.task.run('shell:git_commits_difference');
        var changed_files = grunt.file.read('changed_files.txt');
        console.log(changed_files);
        
    })
}
