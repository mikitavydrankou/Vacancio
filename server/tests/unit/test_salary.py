from routers.applications import _format_salary

class MockSalary:
    def __init__(self, min=None, max=None, currency=None):
        self.min = min
        self.max = max
        self.currency = currency

def test_format_salary_min_max_currency():
    salary = MockSalary(min=1000, max=2000, currency="USD")
    assert _format_salary(salary) == "1000 - 2000 USD"

def test_format_salary_min_only():
    salary = MockSalary(min=1000, currency="EUR")
    assert _format_salary(salary) == "1000+ EUR"

def test_format_salary_max_only():
    salary = MockSalary(max=5000, currency="PLN")
    assert _format_salary(salary) == "up to 5000 PLN"

def test_format_salary_no_currency():
    salary = MockSalary(min=100, max=200)
    assert _format_salary(salary) == "100 - 200"

def test_format_salary_none():
    assert _format_salary(None) is None
