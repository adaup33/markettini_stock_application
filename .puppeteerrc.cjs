/**
 * Puppeteer configuration for GitHub Actions
 * Disables sandbox for Ubuntu 24.04+ AppArmor compatibility
 */
module.exports = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
    ],
};
