from typing import List, Dict, Any, Optional

class PortfolioOptimizer:
    """
    TenderIQ Portfolio Decision & Multi-Tender Optimization Engine.
    Provides multi-tender comparison, ranked Best Tender recommendation,
    pairwise 'Why Not This Tender' explanations, and constrained knapsack-style portfolio optimization.
    """

    @staticmethod
    def compare_tenders(tender_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Builds side-by-side comparison matrix for 2 to 10 tenders.
        """
        metrics = [
            {"key": "title", "label": "Tender Title"},
            {"key": "organization", "label": "Authority / Dept"},
            {"key": "estimated_value_display", "label": "Tender Value"},
            {"key": "readiness_score", "label": "Bid Readiness Score"},
            {"key": "opportunity_score", "label": "Opportunity Score"},
            {"key": "opportunity_verdict", "label": "Recommendation"},
            {"key": "estimated_cost_display", "label": "Estimated Cost"},
            {"key": "expected_profit_display", "label": "Expected Profit"},
            {"key": "profit_margin", "label": "Expected Margin (%)"},
            {"key": "risk_level", "label": "Risk Exposure"},
            {"key": "resource_gap", "label": "Resource Gap (Engineers)"},
            {"key": "preparation_hours", "label": "Bid Effort (Hours)"},
            {"key": "complexity_score", "label": "Tender Complexity"},
            {"key": "submission_deadline", "label": "Submission Deadline"}
        ]

        tenders_matrix = []
        for t in tender_records:
            val = t.get("estimated_value")
            cost = t.get("estimated_cost")
            profit = t.get("expected_profit")

            val_disp = t.get("estimated_value_display") or (f"₹{val/10000000:.2f} Cr" if val else "Not Disclosed")
            cost_disp = f"₹{cost/10000000:.2f} Cr" if cost and cost >= 10000000 else (f"₹{cost/100000:.2f} L" if cost else "Pending")
            profit_disp = f"₹{profit/10000000:.2f} Cr" if profit and profit >= 10000000 else (f"₹{profit/100000:.2f} L" if profit else "Pending")

            tenders_matrix.append({
                "id": t.get("id"),
                "title": t.get("title", "Untitled"),
                "organization": t.get("organization", "Govt Authority"),
                "estimated_value_display": val_disp,
                "readiness_score": t.get("readiness_score", 0),
                "opportunity_score": t.get("opportunity_score", 0.0),
                "opportunity_verdict": t.get("opportunity_verdict", "REVIEW CAREFULLY"),
                "estimated_cost_display": cost_disp,
                "expected_profit_display": profit_disp,
                "profit_margin": f"{t.get('profit_margin', 0):.1f}%",
                "risk_level": "High" if t.get("high_risk_count", 0) > 0 else "Moderate",
                "resource_gap": t.get("gap_engineers", 0),
                "preparation_hours": f"{t.get('bid_effort_hours', 40):.0f}h",
                "complexity_score": f"{t.get('complexity_score', 50):.0f}/100",
                "submission_deadline": t.get("submission_deadline", "Refer Tender Doc")
            })

        # Rank tenders by Opportunity Score
        sorted_tenders = sorted(tender_records, key=lambda x: (x.get("opportunity_score", 0), x.get("readiness_score", 0)), reverse=True)
        best_tender_id = sorted_tenders[0]["id"] if sorted_tenders else None

        return {
            "metrics": metrics,
            "tenders": tenders_matrix,
            "best_tender_id": best_tender_id,
            "total_compared": len(tenders_matrix)
        }

    @staticmethod
    def rank_best_tenders(
        tenders: List[Dict[str, Any]],
        company_capital: float = 0.0,
        company_engineers: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Ranks all active tenders with explicit justification and gaps.
        """
        # Sort by opportunity score desc, then profit margin desc
        sorted_list = sorted(
            tenders,
            key=lambda t: (
                t.get("opportunity_score", 0),
                t.get("profit_margin", 0),
                t.get("readiness_score", 0)
            ),
            reverse=True
        )

        ranked = []
        for idx, t in enumerate(sorted_list):
            rank = idx + 1
            reasons = []
            gaps = []

            opp = t.get("opportunity_score", 0)
            readiness = t.get("readiness_score", 0)
            margin = t.get("profit_margin", 0)
            res_gap = t.get("gap_engineers", 0)
            high_risks = t.get("high_risk_count", 0)

            if readiness >= 80: reasons.append(f"Strong qualification compliance ({readiness}% Readiness)")
            if margin >= 20: reasons.append(f"High profit margin expectation ({margin:.1f}%)")
            if res_gap == 0: reasons.append("Zero engineering resource gap")
            if high_risks == 0: reasons.append("Clean contractual liability terms")

            if res_gap > 0: gaps.append(f"Requires {res_gap} additional engineers")
            if readiness < 75: gaps.append(f"Readiness score ({readiness}%) below comfortable threshold")
            if high_risks > 0: gaps.append(f"{high_risks} stringent penalty/termination risk clauses")

            comparison_vs_top = None
            if idx > 0 and sorted_list:
                top = sorted_list[0]
                diff_opp = round(top.get("opportunity_score", 0) - opp, 1)
                diff_profit = round((top.get("expected_profit", 0) - t.get("expected_profit", 0)) / 100000.0, 1) # in Lakhs
                comparison_vs_top = (
                    f"Ranks below #{sorted_list[0].get('title', '')[:25]} due to "
                    f"{diff_opp} pts lower Opportunity Score"
                    + (f" and ₹{abs(diff_profit):.1f}L lower profit potential." if diff_profit > 0 else ".")
                )

            ranked.append({
                "rank": rank,
                "id": t.get("id"),
                "title": t.get("title"),
                "opportunity_score": opp,
                "readiness_score": readiness,
                "verdict": t.get("opportunity_verdict", "REVIEW CAREFULLY"),
                "expected_profit_margin": margin,
                "expected_profit": t.get("expected_profit", 0),
                "estimated_value": t.get("estimated_value", 0),
                "reasons": reasons if reasons else ["Viable secondary candidate"],
                "gaps": gaps,
                "comparison_vs_top": comparison_vs_top
            })

        return ranked

    @staticmethod
    def optimize_portfolio(
        tenders: List[Dict[str, Any]],
        available_capital: float,
        available_engineers: int,
        available_prep_hours: float
    ) -> Dict[str, Any]:
        """
        Greedy multi-objective optimization to select the highest-return portfolio of tenders
        under engineering, capital, and proposal preparation constraints.
        """
        # Sort tenders by Return on Capital / Opportunity
        scored_tenders = []
        for t in tenders:
            val = t.get("estimated_value") or 5000000.0
            # Working capital demand ~ 15% of contract value for mobilization & initial BoQ
            cap_needed = val * 0.15
            eng_needed = max(1, t.get("required_engineers", 2))
            prep_hrs = max(20.0, t.get("bid_effort_hours", 40.0))
            opp = t.get("opportunity_score", 50.0)
            profit = t.get("expected_profit", val * 0.18)

            scored_tenders.append({
                "tender": t,
                "capital_needed": cap_needed,
                "engineers_needed": eng_needed,
                "prep_hours_needed": prep_hrs,
                "opportunity": opp,
                "profit": profit,
                "value": val
            })

        scored_tenders.sort(key=lambda x: (x["opportunity"], x["profit"]), reverse=True)

        selected = []
        cum_cap = 0.0
        cum_eng = 0
        cum_prep = 0.0
        cum_val = 0.0
        cum_profit = 0.0

        for item in scored_tenders:
            if (cum_cap + item["capital_needed"] <= (available_capital if available_capital > 0 else 1e12) and
                cum_eng + item["engineers_needed"] <= available_engineers and
                cum_prep + item["prep_hours_needed"] <= available_prep_hours):
                selected.append(item["tender"])
                cum_cap += item["capital_needed"]
                cum_eng += item["engineers_needed"]
                cum_prep += item["prep_hours_needed"]
                cum_val += item["value"]
                cum_profit += item["profit"]

        # If nothing fit due to strict capital or hours, at least select the top 1 tender if available
        if not selected and scored_tenders:
            top_t = scored_tenders[0]
            selected.append(top_t["tender"])
            cum_cap = top_t["capital_needed"]
            cum_eng = top_t["engineers_needed"]
            cum_prep = top_t["prep_hours_needed"]
            cum_val = top_t["value"]
            cum_profit = top_t["profit"]

        return {
            "selected_tenders": selected,
            "portfolio_count": len(selected),
            "combined_tender_value": round(cum_val, 2),
            "expected_combined_profit": round(cum_profit, 2),
            "combined_margin": round((cum_profit / cum_val * 100), 2) if cum_val > 0 else 0.0,
            "capital_utilized": round(cum_cap, 2),
            "engineers_utilized": cum_eng,
            "engineers_capacity": available_engineers,
            "engineer_utilization_pct": round((cum_eng / available_engineers) * 100, 1) if available_engineers > 0 else 0,
            "prep_hours_utilized": round(cum_prep, 1),
            "prep_hours_capacity": round(available_prep_hours, 1)
        }
