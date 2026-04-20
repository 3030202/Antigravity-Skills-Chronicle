const esbuild = require('esbuild');

async function build() {
    try {
        await esbuild.build({
            entryPoints: ['./src/extension.ts'],
            bundle: true,
            minify: true,
            sourcemap: false,
            platform: 'node',
            target: 'node18',
            outfile: './dist/extension.js',
            external: ['vscode'],
            format: 'cjs'
        });
        console.log('Build completed successfully.');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
