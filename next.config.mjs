/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    images: {
        remotePatterns: [
            new URL('http://localhost:8080/media/**'),
            // Magento's placeholder image for products without a photo.
            new URL('http://localhost:8080/static/**'),
        ],
    },
};

export default nextConfig;
