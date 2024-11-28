import { defineConfig, loadEnv } from 'vite';
import viteCompression from 'vite-plugin-compression';
import eslint from 'vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import path from 'path';

// const isProd = command === 'build' && mode.startsWith('production');
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const readEnv = loadEnv(mode, './env');
    // @ts-ignore force transform, not a bit problem for string variable
    const metaEvn = readEnv; // 导入设置的环境变量，会根据选择的 mode 选择文件
    // console.warn('IMPORT_META_ENV -> ', metaEvn); // 输出加载的环境变量

    const isProd = command === 'build' && mode.startsWith('production');
    // console and debugger
    const drop_console = isProd || metaEvn.VITE_DROP_CONSOLE === 'true';
    const drop_debugger = isProd || metaEvn.VITE_DROP_DEBUGGER === 'true';
    return {
        plugins: [react(), eslint()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'), // @符号要解析
            },
            extensions: ['.js', '.ts', '.jsx', '.tsx'], // import 可以省略的拓展名
        },
        publicDir: 'public', // 该目录下文件会原封不动存放至 dist
        mode,
        server: {
            hmr: true, // 热更新
            port: 3000,
        },
        build: {
            minify: isProd ? 'terser' : false, // 默认为 esbuild，它比 terser 快 20-40 倍，压缩率只差 1%-2%
            terserOptions: isProd && {
                compress: {
                    drop_console, // 生产环境去除 console
                    drop_debugger, // 生产环境去除 debugger
                },
            },
            rollupOptions: {
                output: {
                    chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
                    entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
                    assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
                    manualChunks(id) {
                        if (
                            id.includes('node_modules') &&
                            (id.includes('antd') ||
                                id.includes('jquery') ||
                                id.includes('swiper') ||
                                id.includes('Scroll') ||
                                id.includes('gsap') ||
                                id.includes('@barba'))
                        ) {
                            // 让每个插件都打包成独立的文件
                            return id.toString().split('node_modules/')[1].split('/')[0].toString();
                        }
                    },
                },
                plugins: [
                    // gzipPlugin()
                    viteCompression({
                        verbose: true, // 是否在控制台中输出压缩结果
                        disable: false,
                        threshold: 10240, // 如果体积大于阈值，将被压缩，单位为b，体积过小时请不要压缩，以免适得其反
                        algorithm: 'gzip', // 压缩算法，可选['gzip'，' brotliccompress '，'deflate '，'deflateRaw']
                        ext: '.gz',
                        deleteOriginFile: false, // 源文件压缩后是否删除
                    }),
                ],
            },
        },
    };
});
