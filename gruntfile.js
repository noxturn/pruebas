module.exports = grunt => {
    grunt.loadNpmTasks('grunt-shell')
    grunt.initConfig({
        shell: {
            theme_lint: {
                command: shop => `./node_modules/.bin/theme-lint stores/${shop}/` //try to do this with a npm script
            },
            get_commits_difference: {
                command: 'git diff HEAD^ HEAD --name-only > changed_files.txt'
            },
            theme_deploy: {
                command: deploy_command => `${deploy_command}`
            }
        }
    })
    grunt.registerTask('default', ['shell'])
    grunt.registerTask('theme-lint', function() {
        var shops = grunt.file.readYAML('config.yml');
        for (let shop in shops) {
            grunt.task.run('shell:theme_lint:' + shop);
        }
    })
    grunt.registerTask('setShopsConfig', function() { //try to reduce loops
        var shops = grunt.file.readYAML('config.yml');
        var configArray = [];
        var configString = '';
        for (let shop in shops) {
            
            for (let env in shops[shop]) {
                configString += env + ':';

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
            grunt.file.write(`stores/${Object.keys(configArray)[0]}/config.yml`,configArray[shop]);

            configArray = [];
            configString = '';
        }
    })
    grunt.registerTask('setFilesToUpload', function() {
        grunt.task.run(['shell:get_commits_difference','getChangedFiles']);
    })
    grunt.registerTask('getChangedFiles', function() {
        var changed_files = grunt.file.read('changed_files.txt').split("\n");
        var shopify_theme_files = [];
        if(changed_files.length > 0){
            changed_files.forEach(e=>{
                if(e.startsWith("store")){
                    shopify_theme_files.push(e);
                }
            })
            console.log("Changed files since last commit");
            shopify_theme_files.forEach(e=>{
                console.log(e);
            })
        }
        grunt.task.run('deploy:' + shopify_theme_files)
    })
    grunt.registerTask('deploy', function(files) {
        // files.split(',').forEach(e=>{})
        //theme files -n --env=process.env.TRAVIS_BRANCH
        grunt.task.run('shell:theme_deploy:' + 'theme deploy ' + files + ' -n --env=' + process.env.TRAVIS_BRANCH);
    })
}
