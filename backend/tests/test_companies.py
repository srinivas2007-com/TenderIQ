import pytest
from app.services.company_fit_engine import CompanyFitEngine, SAMPLE_COMPANIES_DATA, SAMPLE_COMPANY_FIT_TENDER

class DummyCompany:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

def test_company_fit_engine_results():
    # 1. TechNova Solutions
    technova_data = next(c for c in SAMPLE_COMPANIES_DATA if "TechNova" in c["name"])
    technova = DummyCompany(**technova_data)
    fit_technova = CompanyFitEngine.evaluate_fit(technova, SAMPLE_COMPANY_FIT_TENDER)
    
    assert fit_technova["fit_score"] == 48
    assert fit_technova["is_eligible"] is False
    assert fit_technova["result_label"] == "Not Eligible"
    assert fit_technova["criteria"]["turnover"]["status"] == "fail"
    assert fit_technova["criteria"]["experience"]["status"] == "fail"
    assert fit_technova["criteria"]["certification"]["status"] == "fail"
    assert fit_technova["criteria"]["workforce"]["status"] == "fail"

    # 2. Apex Digital Technologies
    apex_data = next(c for c in SAMPLE_COMPANIES_DATA if "Apex Digital" in c["name"])
    apex = DummyCompany(**apex_data)
    fit_apex = CompanyFitEngine.evaluate_fit(apex, SAMPLE_COMPANY_FIT_TENDER)

    assert fit_apex["fit_score"] == 84
    assert fit_apex["is_eligible"] is True
    assert fit_apex["result_label"] == "Eligible"
    assert fit_apex["criteria"]["turnover"]["status"] in ["pass", "exceeds"]
    assert fit_apex["criteria"]["experience"]["status"] in ["pass", "exceeds"]
    assert fit_apex["criteria"]["certification"]["status"] in ["pass", "exceeds"]
    assert fit_apex["criteria"]["workforce"]["status"] in ["pass", "exceeds"]

    # 3. Innovent Systems
    innovent_data = next(c for c in SAMPLE_COMPANIES_DATA if "Innovent" in c["name"])
    innovent = DummyCompany(**innovent_data)
    fit_innovent = CompanyFitEngine.evaluate_fit(innovent, SAMPLE_COMPANY_FIT_TENDER)

    assert fit_innovent["fit_score"] == 96
    assert fit_innovent["is_eligible"] is True
    assert fit_innovent["result_label"] == "Eligible"
    assert fit_innovent["criteria"]["turnover"]["status"] == "exceeds"
    assert fit_innovent["criteria"]["experience"]["status"] == "exceeds"
    assert fit_innovent["criteria"]["certification"]["status"] in ["pass", "exceeds"]
    assert fit_innovent["criteria"]["workforce"]["status"] == "exceeds"

if __name__ == "__main__":
    test_company_fit_engine_results()
    print("[OK] All company fit engine assertions passed 100%!")
