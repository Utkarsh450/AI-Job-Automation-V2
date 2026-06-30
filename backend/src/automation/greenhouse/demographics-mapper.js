/**
 * Pure logic file for determining which demographic option to select.
 * Separates data mapping from Playwright DOM interactions.
 */

const inferDemographicOption = (labelText, optionTexts, lowerOptionTexts, userInfo) => {
    const optionsString = lowerOptionTexts.join(' ');
    let inferredDirectText = null;
    
    if ((optionsString.includes('male') && optionsString.includes('female')) || (optionsString.includes('man') && optionsString.includes('woman'))) {
        let gender = (userInfo.demographics?.gender || "decline").toLowerCase();
        if (gender === 'male' && optionsString.includes('man') && !optionsString.includes('male')) {
            inferredDirectText = 'man';
        } else if (gender === 'female' && optionsString.includes('woman') && !optionsString.includes('female')) {
            inferredDirectText = 'woman';
        } else {
            inferredDirectText = gender;
        }
    } else if (optionsString.includes('hispanic') || optionsString.includes('asian') || optionsString.includes('white')) {
        inferredDirectText = (userInfo.demographics?.race || "decline").toLowerCase();
    } else if (optionsString.includes('veteran')) {
        const vet = userInfo.demographics?.veteranStatus || "Decline";
        if (vet === "I am not a protected veteran") inferredDirectText = "not a protected";
        else if (vet === "I am a protected veteran") inferredDirectText = "identify as";
        else inferredDirectText = "decline";
    } else if (optionsString.includes('disability') || optionsString.includes('impairment')) {
        const dis = userInfo.demographics?.disabilityStatus || "Decline";
        if (dis === "No") inferredDirectText = "not have";
        else if (dis === "Yes") inferredDirectText = "yes, i have";
        else inferredDirectText = "don't wish";
    } else if (optionsString.includes('she/her') || optionsString.includes('he/him') || optionsString.includes('they/them')) {
        inferredDirectText = (userInfo.preferences?.pronouns || "decline").toLowerCase();
        if (inferredDirectText.includes('she')) inferredDirectText = 'she/her';
        else if (inferredDirectText.includes('he')) inferredDirectText = 'he/him';
        else if (inferredDirectText.includes('they')) inferredDirectText = 'they/them';
    } else if ((optionsString.includes('remote') || optionsString.includes('hybrid') || optionsString.includes('on-site')) && userInfo.preferences?.remotePreference && userInfo.preferences.remotePreference !== 'Any') {
        inferredDirectText = userInfo.preferences.remotePreference.toLowerCase();
    } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.includes('authorized')) {
        inferredDirectText = userInfo.preferences?.authorizedToWork !== false ? "yes" : "no";
    } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.includes('sponsorship')) {
        inferredDirectText = userInfo.preferences?.requiresVisaSponsorship === true ? "yes" : "no";
    } else if (optionsString.includes('yes') && optionsString.includes('no') && (labelText.toLowerCase().includes('worked for') && labelText.toLowerCase().includes('before'))) {
        inferredDirectText = userInfo.preferences?.previouslyEmployed === true ? "yes" : "no";
    } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('ph.d')) {
        inferredDirectText = userInfo.preferences?.enrolledInPhD === true ? "yes" : "no";
    } else if (labelText.toLowerCase().includes('how many years') && labelText.toLowerCase().includes('ph.d')) {
        inferredDirectText = (userInfo.preferences?.yearsInPhD || "decline").toLowerCase();
    } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('located in the us')) {
        inferredDirectText = userInfo.preferences?.locatedInUS === false ? "no" : "yes";
    } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('bay area')) {
        inferredDirectText = userInfo.preferences?.willingToRelocate === true ? "yes" : "no";
    } else if (optionsString.includes('lgbtq')) {
        inferredDirectText = (userInfo.preferences?.lgbtqStatus || "decline").toLowerCase();
    }

    if (inferredDirectText) {
        for (let i = 0; i < lowerOptionTexts.length; i++) {
            if (lowerOptionTexts[i].includes(inferredDirectText)) {
                return { matched: true, index: i, reason: 'Inferred Direct Match' };
            }
        }
    }
    
    return { matched: false, index: lowerOptionTexts.length - 1, reason: 'Fallback to last option' };
};

const getDesiredDemographicText = (labelText, userInfo) => {
    if (labelText.includes('gender') && !labelText.includes('identity')) {
        return (userInfo.demographics?.gender || "decline").toLowerCase();
    } else if (labelText.includes('veteran')) {
        const vet = userInfo.demographics?.veteranStatus || "Decline";
        if (vet === "I am not a protected veteran") return "not a protected";
        if (vet === "I am a protected veteran") return "identify as";
        return "decline";
    } else if (labelText.includes('disability')) {
        const dis = userInfo.demographics?.disabilityStatus || "Decline";
        if (dis === "No") return "don't have";
        if (dis === "Yes") return "yes, i have";
        return "don't wish";
    } else if (labelText.includes('race') || labelText.includes('ethnicity') || labelText.includes('hispanic')) {
        return (userInfo.demographics?.race || "decline").toLowerCase();
    } else if (labelText.includes('gender identity') || labelText.includes('lgbtq')) {
        return "don't wish";
    } else if (labelText.includes('authorized')) {
        return 'yes';
    } else if (labelText.includes('sponsorship')) {
        return 'no';
    }
    return null;
};

module.exports = {
    inferDemographicOption,
    getDesiredDemographicText
};
