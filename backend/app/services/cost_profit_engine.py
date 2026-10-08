from typing import Dict, Any, Optional

class CostProfitEngine:
    """
    Deterministic Cost Estimation and Multi-Scenario Profit Engine for TenderIQ AI.
    Calculates cost drivers based on tender value, industry sector, duration, and scope.
    Computes Optimistic, Expected, and Pessimistic profit scenarios.
    """

    @staticmethod
    def estimate_cost(
        tender_value: Optional[float],
        industry: Optional[str] = "IT",
        contract_duration_months: int = 12,
        custom_overrides: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates itemized cost estimate.
        If tender_value is unknown/None, computes relative baseline per month.
        """
        val = tender_value or 10000000.0  # ₹1 Cr baseline if unknown for relative breakdown
        has_real_val = tender_value is not None and tender_value > 0

        # Industry distribution heuristics
        ind = (industry or "").lower()
        if "civil" in ind or "construction" in ind or "infra" in ind:
            labour_pct = 0.25
            materials_pct = 0.38
            equipment_pct = 0.12
            software_pct = 0.02
            travel_pct = 0.02
            subcontracting_pct = 0.08
            overhead_pct = 0.05
            contingency_pct = 0.06
        elif "elec" in ind or "power" in ind:
            labour_pct = 0.22
            materials_pct = 0.42
            equipment_pct = 0.10
            software_pct = 0.03
            travel_pct = 0.02
            subcontracting_pct = 0.07
            overhead_pct = 0.06
            contingency_pct = 0.06
        else:
            # IT / Software / Services
            labour_pct = 0.48
            materials_pct = 0.05
            equipment_pct = 0.06
            software_pct = 0.14
            travel_pct = 0.03
            subcontracting_pct = 0.08
            overhead_pct = 0.09
            contingency_pct = 0.05

        # Base execution cost is typically ~75% - 82% of tender estimated value
        cost_ratio = 0.78
        base_total = val * cost_ratio

        labour = base_total * labour_pct
        materials = base_total * materials_pct
        equipment = base_total * equipment_pct
        software = base_total * software_pct
        travel = base_total * travel_pct
        subcontracting = base_total * subcontracting_pct
        overhead = base_total * overhead_pct
        contingency = base_total * contingency_pct

        # Apply overrides if simulator or user provided custom tweaks
        if custom_overrides:
            if "labour_cost" in custom_overrides: labour = custom_overrides["labour_cost"]
            if "materials_cost" in custom_overrides: materials = custom_overrides["materials_cost"]
            if "equipment_cost" in custom_overrides: equipment = custom_overrides["equipment_cost"]
            if "subcontracting_cost" in custom_overrides: subcontracting = custom_overrides["subcontracting_cost"]
            if "contingency_cost" in custom_overrides: contingency = custom_overrides["contingency_cost"]

        total_cost = labour + materials + equipment + software + travel + subcontracting + overhead + contingency

        assumptions = {
            "is_estimated": True,
            "has_benchmark_value": has_real_val,
            "cost_to_value_ratio": round(total_cost / val, 3) if val > 0 else 0.78,
            "duration_months": contract_duration_months,
            "industry_profile": industry or "General",
            "confidence_label": "High Confidence - Industry Benchmarked" if has_real_val else "Estimated - Medium Confidence",
            "notes": "Cost drivers derived deterministically from standard Indian procurement benchmarks."
        }

        return {
            "tender_value": val if has_real_val else None,
            "labour_cost": round(labour, 2),
            "materials_cost": round(materials, 2),
            "equipment_cost": round(equipment, 2),
            "software_tech_cost": round(software, 2),
            "travel_cost": round(travel, 2),
            "subcontracting_cost": round(subcontracting, 2),
            "overhead_admin_cost": round(overhead, 2),
            "contingency_cost": round(contingency, 2),
            "total_estimated_cost": round(total_cost, 2),
            "assumptions": assumptions
        }

    @staticmethod
    def calculate_profit_scenarios(
        tender_value: Optional[float],
        cost_breakdown: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates Optimistic, Expected, and Pessimistic profit scenarios.
        Expected = Value - Estimated Cost
        Optimistic = 8% higher margin due to procurement efficiency & zero rework
        Pessimistic = 10% higher costs due to inflation & contingency realization
        """
        val = tender_value or 0.0
        tot_cost = cost_breakdown.get("total_estimated_cost", 0.0)

        if val <= 0:
            return {
                "tender_value": 0.0,
                "optimistic_profit": 0.0,
                "optimistic_margin": 0.0,
                "expected_profit": 0.0,
                "expected_margin": 0.0,
                "pessimistic_profit": 0.0,
                "pessimistic_margin": 0.0,
                "risk_reserve": 0.0,
                "financing_cost": 0.0,
                "notes": "Tender value not disclosed in source document; profit calculation pending quoted bid value."
            }

        # Financing Cost (cost of PBG, EMD blocking, working capital credit ~ 2% of contract value)
        financing_cost = val * 0.02
        risk_reserve = val * 0.03

        # Expected
        expected_profit = max(0.0, val - tot_cost - financing_cost)
        expected_margin = round((expected_profit / val) * 100, 2)

        # Optimistic (cost savings 7%, contingency unused)
        optimistic_cost = tot_cost * 0.93 - cost_breakdown.get("contingency_cost", 0.0) * 0.5
        optimistic_profit = max(0.0, val - optimistic_cost - financing_cost * 0.8)
        optimistic_margin = round((optimistic_profit / val) * 100, 2)

        # Pessimistic (cost overrun 8%, risk reserve consumed)
        pessimistic_cost = tot_cost * 1.08 + risk_reserve
        pessimistic_profit = max(0.0, val - pessimistic_cost - financing_cost * 1.2)
        pessimistic_margin = round((pessimistic_profit / val) * 100, 2)

        return {
            "tender_value": val,
            "optimistic_profit": round(optimistic_profit, 2),
            "optimistic_margin": optimistic_margin,
            "expected_profit": round(expected_profit, 2),
            "expected_margin": expected_margin,
            "pessimistic_profit": round(pessimistic_profit, 2),
            "pessimistic_margin": pessimistic_margin,
            "risk_reserve": round(risk_reserve, 2),
            "financing_cost": round(financing_cost, 2),
            "notes": "Profit scenarios modeled on deterministic procurement cost curves. Not a financial guarantee."
        }
