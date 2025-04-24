/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 */
module.exports = {
    files: [
        './**/*.{html,htm,css,js}',
        '!./**/*.frag', // Ignore shader files
        '!./**/*.vert'  // Ignore vertex shader files too
    ],
    server: './',
    watch: true,
    notify: false
}; 