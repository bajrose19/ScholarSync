def _matches(needle, haystack):
    left = needle.lower()
    return any(left in item.lower() or item.lower() in left for item in haystack)


def score_match(skills, interests, needed, areas):
    student_skills = skills or []
    student_interests = interests or []
    needed = needed or []
    areas = areas or []
    matched_skills = [skill for skill in student_skills if _matches(skill, needed)]
    matched_interests = [interest for interest in student_interests if _matches(interest, areas)]
    skill_score = len(matched_skills) / len(needed) if needed else 0
    interest_score = len(matched_interests) / len(areas) if areas else 0
    return {
        "match_score": (skill_score * 0.6) + (interest_score * 0.4),
        "matched_skills": matched_skills,
        "matched_interests": matched_interests,
    }


def annotate(user, opportunities):
    student = user and user.get("role") == "student"
    for opportunity in opportunities:
        if student:
            opportunity.update(
                score_match(
                    user.get("skills"),
                    user.get("interests"),
                    opportunity.get("skills_needed"),
                    opportunity.get("research_areas"),
                )
            )
        else:
            opportunity["match_score"] = None
            opportunity["matched_skills"] = []
            opportunity["matched_interests"] = []
    return opportunities
