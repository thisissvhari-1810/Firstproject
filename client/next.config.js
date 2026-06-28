/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    API_URL: process.env.API_URL,
  },
  reactStrictMode: true,

  images: {
    domains: [
      // seed data (post images + user avatars) - keep these in every env
      // or the demo posts won't render at all
      "picsum.photos",
      "randomuser.me",
      // original author's S3 buckets (kept so existing prod data still works)
      "quickpics-images.s3.eu-west-2.amazonaws.com",
      "quickpics-images-test.s3.eu-west-2.amazonaws.com",
    ],
  },
};
