/**
 * Maps standard TSENTA demographic options to Workday's specific dropdown strings.
 * This ensures the bot can easily filter dropdowns by typing the exact string.
 */
const mapWorkdayDemographics = (questionText, answerVal) => {
    if (!answerVal) return null;
    const lowerQ = questionText.toLowerCase();
    const lowerA = answerVal.toLowerCase();

    // Gender
    if (lowerQ.includes('gender')) {
        if (lowerA.includes('male') && !lowerA.includes('female')) return 'Male';
        if (lowerA.includes('female')) return 'Female';
        if (lowerA.includes('non-binary') || lowerA.includes('non binary')) return 'Non-Binary';
        return 'Decline'; // Fallback / Decline
    }

    // Race / Ethnicity / Hispanic
    if (lowerQ.includes('race') || lowerQ.includes('ethnicity') || lowerQ.includes('hispanic')) {
        if (lowerA.includes('asian')) return 'Asian';
        if (lowerA.includes('black') || lowerA.includes('african')) return 'Black or African American';
        if (lowerA.includes('hispanic') || lowerA.includes('latino')) return 'Hispanic or Latino';
        if (lowerA.includes('white')) return 'White';
        if (lowerA.includes('hawaiian') || lowerA.includes('pacific')) return 'Native Hawaiian or Other Pacific Islander';
        if (lowerA.includes('indian') || lowerA.includes('native american')) return 'American Indian or Alaska Native';
        if (lowerA.includes('two') || lowerA.includes('multiple')) return 'Two or More Races';
        return 'Decline'; // Fallback / Decline
    }

    // Veteran Status
    if (lowerQ.includes('veteran')) {
        if (lowerA.includes('not a protected veteran') || lowerA.includes('no')) return 'I am not a protected veteran';
        if (lowerA.includes('am a protected veteran') || lowerA.includes('yes')) return 'I identify as one or more of the classifications of protected veteran';
        return 'Decline';
    }

    // Disability Status
    if (lowerQ.includes('disability')) {
        if (lowerA === 'no') return 'No, I don\'t have a disability';
        if (lowerA === 'yes') return 'Yes, I have a disability';
        return 'Decline';
    }

    return answerVal;
};

module.exports = {
    mapWorkdayDemographics
};
