"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateInterviewScore = void 0;
const calculateInterviewScore = (techSkillScore = {}, softSkillScore) => {
    let techScorePercent = 0;
    let softScorePercent = 0;
    const skillIds = Object.keys(techSkillScore);
    const numSkills = skillIds.length;
    if (numSkills > 0) {
        const perSkillWeight = 60 / numSkills;
        skillIds.forEach((skillId) => {
            const skillScore = techSkillScore[skillId];
            if (typeof skillScore === "number" &&
                skillScore >= 0 &&
                skillScore <= 5) {
                techScorePercent += (skillScore / 5) * perSkillWeight;
            }
        });
    }
    if (typeof softSkillScore === "number" &&
        softSkillScore >= 0 &&
        softSkillScore <= 5) {
        softScorePercent = (softSkillScore / 5) * 40;
    }
    return Math.round(techScorePercent + softScorePercent);
};
exports.calculateInterviewScore = calculateInterviewScore;
//# sourceMappingURL=interviewRound.service.js.map