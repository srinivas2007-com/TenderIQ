import pytest
from app.services.cost_profit_engine import CostProfitEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.resource_engine import ResourceEngine
from app.services.complexity_effort_engine import ComplexityEffortEngine
from app.services.portfolio_optimizer import PortfolioOptimizer
from app.services.report_generator import ReportGenerator

def test_cost_profit_engine():
    cost = CostProfitEngine.estimate_cost(tender_value=10000000.0, industry="IT")
    assert cost["total_estimated_cost"] > 0
    assert cost["labour_cost"] > 0
    assert cost["contingency_cost"] > 0

    profit = CostProfitEngine.calculate_profit_scenarios(tender_value=10000000.0, cost_breakdown=cost)
    assert profit["expected_profit"] > 0
    assert profit["expected_margin"] > 0
    assert profit["optimistic_profit"] >= profit["expected_profit"]
    assert profit["expected_profit"] >= profit["pessimistic_profit"]

def test_opportunity_engine():
    score_breakdown = {
        "eligibility": {"earned": 36.0},
        "technical": {"earned": 18.0},
        "financial": {"earned": 14.0},
        "experience": {"earned": 12.0}
    }
    res = OpportunityEngine.calculate_opportunity_score(
        readiness_score=85,
        score_breakdown=score_breakdown,
        expected_profit_margin=22.0,
        risk_count=2,
        high_risk_count=0,
        resource_gap_count=0,
        tender_value=15000000.0
    )
    assert 0 <= res["opportunity_score"] <= 100
    assert res["opportunity_verdict"] in [
        "HIGHLY RECOMMENDED", "RECOMMENDED", "REVIEW CAREFULLY", "HIGH RISK", "NOT RECOMMENDED"
    ]
    assert len(res["breakdown"]["strengths"]) > 0

def test_resource_engine():
    res = ResourceEngine.calculate_resource_requirements(
        tender_value=15000000.0,
        industry="IT",
        company_engineers_available=5
    )
    assert res["required_engineers"] > 0
    assert "action_recommended" in res

    active_tenders = [
        {"id": "t1", "required_engineers": 4, "preparation_hours": 30.0},
        {"id": "t2", "required_engineers": 3, "preparation_hours": 40.0}
    ]
    conflict = ResourceEngine.detect_multi_tender_conflicts(
        active_tenders=active_tenders,
        company_engineers_available=5
    )
    assert conflict["has_conflict"] is True
    assert conflict["engineer_deficit"] == 2

def test_complexity_effort_engine():
    comp = ComplexityEffortEngine.calculate_complexity(
        page_count=65,
        requirements_count=12,
        risks_count=3,
        documents_count=8,
        estimated_value=12000000.0
    )
    assert 15.0 <= comp <= 100.0

    effort = ComplexityEffortEngine.estimate_bid_effort(comp)
    assert effort["total_effort_hours"] > 0
    assert effort["breakdown"]["technical_proposal_hours"] > 0

    milestones = ComplexityEffortEngine.generate_internal_milestones("15-11-2026")
    assert len(milestones) == 4

def test_portfolio_optimizer():
    tenders = [
        {
            "id": "t1", "title": "Tender A", "estimated_value": 10000000.0,
            "opportunity_score": 88.0, "readiness_score": 90, "profit_margin": 24.0,
            "expected_profit": 2400000.0, "required_engineers": 3, "bid_effort_hours": 40.0
        },
        {
            "id": "t2", "title": "Tender B", "estimated_value": 20000000.0,
            "opportunity_score": 75.0, "readiness_score": 80, "profit_margin": 18.0,
            "expected_profit": 3600000.0, "required_engineers": 5, "bid_effort_hours": 60.0
        }
    ]
    comp = PortfolioOptimizer.compare_tenders(tenders)
    assert comp["total_compared"] == 2
    assert comp["best_tender_id"] == "t1"

    ranked = PortfolioOptimizer.rank_best_tenders(tenders, company_capital=50000000.0, company_engineers=10)
    assert ranked[0]["rank"] == 1
    assert ranked[0]["id"] == "t1"
    assert ranked[1]["comparison_vs_top"] is not None

def test_report_generator():
    tender_data = {
        "tender": {
            "title": "Smart City IoT & Infrastructure Deployment",
            "reference_number": "NIT/2026/089",
            "organization": "Urban Development Authority",
            "location": "Mumbai, India",
            "contract_duration": "24 Months",
            "estimated_value_display": "₹12.50 Crore",
            "opportunity_score": 89.5,
            "opportunity_verdict": "HIGHLY RECOMMENDED"
        },
        "analysis": {
            "readiness_score": 88,
            "recommendation": "SUITABLE TO APPLY",
            "executive_summary": "Comprehensive procurement analysis for metropolitan IoT platform."
        },
        "cost_estimate": {
            "labour_cost": 4500000,
            "materials_cost": 2500000,
            "equipment_cost": 800000,
            "software_tech_cost": 1200000,
            "subcontracting_cost": 600000,
            "overhead_admin_cost": 500000,
            "contingency_cost": 400000,
            "total_estimated_cost": 10500000
        },
        "profit_scenario": {
            "optimistic_profit": 2800000, "optimistic_margin": 22.4,
            "expected_profit": 2000000, "expected_margin": 16.0,
            "pessimistic_profit": 1100000, "pessimistic_margin": 8.8,
            "risk_reserve": 375000
        },
        "requirements": [
            {
                "requirement_title": "Minimum Annual Turnover",
                "tender_requirement": "Average annual turnover of ₹8.0 Crore",
                "company_status": "₹12.0 Crore",
                "match_result": "PASS",
                "source_page": 4
            }
        ],
        "risks": [
            {
                "title": "Liquidated Damages Clause",
                "severity": "HIGH",
                "description": "0.5% delay penalty per week up to 10% ceiling.",
                "mitigation_suggestion": "Maintain 2-week schedule buffer."
            }
        ]
    }
    pdf_io = ReportGenerator.generate_tender_pdf(tender_data)
    pdf_bytes = pdf_io.getvalue()
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
