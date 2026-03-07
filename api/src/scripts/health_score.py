import sys
import json
import math

def compute_std_dev(values):
    if len(values) <= 1:
        return 0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return math.sqrt(variance)

def clamp(val, min_val=0, max_val=1):
    return min(max_val, max(min_val, val))

def calculate_health_score(transactions):
    if not transactions:
        return {
            "score": 0,
            "noData": True,
            "components": {"savingsRate": 0, "expenseRatio": 0, "spendingConsistency": 0, "categoryDiversity": 0},
        }

    income_tx = [t for t in transactions if t.get('type') == 'income']
    expense_tx = [t for t in transactions if t.get('type') == 'expense']

    total_income = sum(t.get('amount', 0) for t in income_tx)
    total_expenses = sum(t.get('amount', 0) for t in expense_tx)

    # 1. Savings Rate (40%)
    savings_rate = 0
    if total_income > 0:
        savings_rate = clamp((total_income - total_expenses) / total_income)
    
    # 2. Expense Ratio (30%)
    expense_ratio = 1
    if total_income > 0:
        expense_ratio = clamp(1 - total_expenses / total_income)
    elif total_expenses > 0:
        expense_ratio = 0

    # 3. Spending Consistency (20%)
    spending_consistency = 1
    if len(expense_tx) > 1:
        daily_map = {}
        for t in expense_tx:
            # Simple date parsing for standard ISO format
            day = t.get('date', '')[:10] 
            daily_map[day] = daily_map.get(day, 0) + t.get('amount', 0)
        
        daily_values = list(daily_map.values())
        if len(daily_values) > 1:
            mean = sum(daily_values) / len(daily_values)
            stddev = compute_std_dev(daily_values)
            cv = stddev / mean if mean > 0 else 0
            spending_consistency = clamp(1 - cv)

    # 4. Category Diversity (10%)
    expense_categories = set(t.get('category') for t in expense_tx)
    category_diversity = clamp(len(expense_categories) / 5)

    # Final weighted score
    raw_score = (
        savings_rate * 0.4 +
        expense_ratio * 0.3 +
        spending_consistency * 0.2 +
        category_diversity * 0.1
    )

    score = round(raw_score * 100)

    return {
        "score": score,
        "noData": False,
        "components": {
            "savingsRate": round(savings_rate * 100),
            "expenseRatio": round(expense_ratio * 100),
            "spendingConsistency": round(spending_consistency * 100),
            "categoryDiversity": round(category_diversity * 100),
        },
    }

if __name__ == "__main__":
    try:
        # Read transactions from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data"}))
            sys.exit(1)
            
        transactions = json.loads(input_data)
        result = calculate_health_score(transactions)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
