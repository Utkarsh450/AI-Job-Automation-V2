const logger = require('../../utils/logger');

/**
 * Fetches all jobs from a single Workday board using the cxs JSON API.
 * Standardizes the output format for the job orchestrator.
 * 
 * @param {Object} companyConfig The config object for the company
 * @param {string} companyConfig.name e.g., 'mastercard'
 * @param {string} companyConfig.apiUrl e.g., 'https://mastercard.wd1.myworkdayjobs.com/wday/cxs/mastercard/CorporateCareers/jobs'
 * @param {string} companyConfig.siteUrl e.g., 'https://mastercard.wd1.myworkdayjobs.com/CorporateCareers'
 */
const scrapeWorkday = async (companyConfig) => {
    try {
        logger.info(`Fetching Workday jobs for ${companyConfig.name} from ${companyConfig.apiUrl}...`);
        
        // Step 1: Fetch the list of jobs
        const res = await fetch(companyConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                appliedFacets: {},
                limit: 20, // Fetching top 20 latest jobs for MVP
                offset: 0,
                searchText: ""
            })
        });

        if (!res.ok) {
            logger.warn(`Workday API returned ${res.status} for ${companyConfig.name}`);
            return [];
        }

        const data = await res.json();
        const postings = data.jobPostings || [];
        
        if (postings.length === 0) return [];

        const jobs = [];

        // Step 2: Fetch details for each job to get the full HTML description
        // We do this sequentially or with Promise.all to avoid rate limits
        // For MVP, we'll just map the summary if detailed fetching is too slow, but ATS tailoring needs the full JD.
        for (const post of postings) {
            try {
                // The detailed endpoint is the base API URL (without /jobs) + externalPath
                // e.g. .../wday/cxs/mastercard/CorporateCareers + /job/New-York/...
                const basePath = companyConfig.apiUrl.replace(/\/jobs$/, '');
                const detailUrl = `${basePath}${post.externalPath}`;
                
                const detailRes = await fetch(detailUrl, {
                    headers: { 'Accept': 'application/json' }
                });
                
                let descriptionHtml = post.title; // fallback
                if (detailRes.ok) {
                    const detailData = await detailRes.json();
                    descriptionHtml = detailData.jobPostingInfo?.jobDescription || post.title;
                }

                jobs.push({
                    title: post.title,
                    company: companyConfig.name,
                    location: post.locationsText || 'Remote',
                    descriptionHtml: descriptionHtml,
                    url: `${companyConfig.siteUrl}${post.externalPath}`,
                    atsPlatform: 'workday'
                });

                // Small delay to prevent rate-limiting from Workday
                await new Promise(r => setTimeout(r, 200));

            } catch (err) {
                logger.warn(`Failed to fetch details for Workday job ${post.title}: ${err.message}`);
                // Push with minimal data if detail fails
                jobs.push({
                    title: post.title,
                    company: companyConfig.name,
                    location: post.locationsText || 'Remote',
                    descriptionHtml: post.title,
                    url: `${companyConfig.siteUrl}${post.externalPath}`,
                    atsPlatform: 'workday'
                });
            }
        }

        return jobs;
    } catch (err) {
        logger.error(`Failed to fetch Workday board "${companyConfig.name}": ${err.message}`);
        return [];
    }
};

module.exports = {
    scrapeWorkday
};
