from typing import Dict, Any, List, Optional

class OpportunityEngine:
    """
    TenderIQ Opportunity Scoring Engine.
    Distinct from Bid Readiness (qualification). Evaluates whether the tender is commercially and strategically advantageous to pursue.
    Weights per Section 11:
      - Eligibility Fit: 20%
      - Technical Fit: 15%
      - Financial Fit: 15%
      - Experience Fit: 10%
      - Profit Potential: 15%
      - Risk: 10%
      - Resource Feasibility: 5%
      - Competition: 5%
      - Strategic Value: 5%
    """

    @staticmethod
    def calculate_opportunity_score(
        readiness_score: float,
        score_breakdown: Dict[str, Any],
        expected_profit_margin: float,
        risk_count: int,
        high_risk_count: int,
        resource_gap_count: int = 0,
        tender_value: Optional[float] = None
    ) -> Dict[str, Any]:
        # 1. Eligibility Fit (20%) - from readiness score eligibility component (max 40 scaled to 20)
        elig_earned = score_breakdown.get("eligibility", {}).get("earned", 0.0)
        elig_fit = min(20.0, (elig_earned / 40.0) * 20.0)

        # 2. Technical Fit (15%) - from technical score (max 20 scaled to 15)
        tech_earned = score_breakdown.get("technical", {}).get("earned", 0.0)
        tech_fit = min(15.0, (tech_earned / 20.0) * 15.0)

        # 3. Financial Fit (15%) - from financial score (max 15)
        fin_earned = score_breakdown.get("financial", {}).get("earned", 0.0)
        fin_fit = min(15.0, (fin_earned / 15.0) * 15.0)

        # 4. Experience Fit (10%) - from experience score (max 15 scaled to 10)
        exp_earned = score_breakdown.get("experience", {}).get("earned", 0.0)
        exp_fit = min(10.0, (exp_earned / 15.0) * 10.0)

        # 5. Profit Potential (15%)
        # Margin >= 25% gets full 15; 15-25% gets 10-14; < 10% gets lower
        if expected_profit_margin >= 25.0:
            profit_fit = 15.0
        elif expected_profit_margin >= 18.0:
            profit_fit = 12.0
        elif expected_profit_margin >= 10.0:
            profit_fit = 8.0
        elif expected_profit_margin > 0.0:
            profit_fit = 4.0
        else:
            profit_fit = 2.0

        # 6. Risk Profile (10%)
        # Deduct for high risks
        risk_penalty = (high_risk_count * 3.0) + (risk_count * 0.5)
        risk_fit = max(0.0, 10.0 - min(10.0, risk_penalty))

        # 7. Resource Feasibility (5%)
        # Deduct for engineer/personnel gaps
        res_penalty = resource_gap_count * 1.5
        resource_fit = max(0.0, 5.0 - min(5.0, res_penalty))

        # 8. Competition Dynamics (5%)
        # Based on tender size & barrier to entry (larger specialized tenders have fewer bidders)
        if tender_value and tender_value > 50000000:  # > 5 Cr
            comp_fit = 4.5
        elif tender_value and tender_value > 10000000: # > 1 Cr
            comp_fit = 3.5
        else:
            comp_fit = 3.0

        # 9. Strategic Value (5%)
        # Standard baseline for portfolio expansion
        strategic_fit = 4.0

        total_score = round(
            elig_fit + tech_fit + fin_fit + exp_fit + profit_fit + risk_fit + resource_fit + comp_fit + strategic_fit,
            1
        )
        total_score = min(100.0, max(0.0, total_score))

        # Classification per prompt §11
        if total_score >= 85:
            verdict = "HIGHLY RECOMMENDED"
        elif total_score >= 70:
            verdict = "RECOMMENDED"
        elif total_score >= 55:
            verdict = "REVIEW CAREFULLY"
        elif total_score >= 40:
            verdict = "HIGH RISK"
        else:
            verdict = "NOT RECOMMENDED"

        # Explainability & Reasons
        strengths = []
        cautions = []
        if elig_fit >= 16: strengths.append("High baseline eligibility compliance")
        if profit_fit >= 12: strengths.append(f"Strong profit margin potential ({expected_profit_margin:.1f}%)")
        if tech_fit >= 12: strengths.append("Robust technical capability alignment")
        if risk_fit >= 8: strengths.append("Low contractual liability exposure")

        if elig_fit < 12: cautions.append("Eligibility gaps require joint venture or documentation remediation")
        if high_risk_count > 0: cautions.append(f"{high_risk_count} critical contractual risk clauses identified")
        if resource_gap_count > 0: cautions.append(f"Requires capacity expansion ({resource_gap_count} resource gap)")
        if expected_profit_margin < 12: cautions.append("Compressed profit margin may restrict execution buffer")

        breakdown = {
            "eligibility_fit": {"earned": round(elig_fit, 1), "max": 20},
            "technical_fit": {"earned": round(tech_fit, 1), "max": 15},
            "financial_fit": {"earned": round(fin_fit, 1), "max": 15},
            "experience_fit": {"earned": round(exp_fit, 1), "max": 10},
            "profit_potential": {"earned": round(profit_fit, 1), "max": 15},
            "risk_profile": {"earned": round(risk_fit, 1), "max": 10},
            "resource_feasibility": {"earned": round(resource_fit, 1), "max": 5},
            "competition": {"earned": round(comp_fit, 1), "max": 5},
            "strategic_value": {"earned": round(strategic_fit, 1), "max": 5},
            "strengths": strengths,
            "cautions": cautions
        }

        return {
            "opportunity_score": total_score,
            "opportunity_verdict": verdict,
            "breakdown": breakdown
        }
