import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from services.ai_service import process_raw_news, verify_output_facts

def test_delap():
    raw_title = "Delap double inspires Forest to stunning win over Man City"
    raw_summary = "Liam Delap scores a superb double as Nottingham Forest stun Manchester City 3-1 for their first Premier League win at the City Ground this season."
    source_name = "BBC Sport"
    source_url = "https://www.bbc.co.uk/sport/football/articles/example"

    source_text = f"Title: {raw_title}\n\nSummary/Excerpt: {raw_summary}\n\nSource: {source_name}\nURL: {source_url}"

    print("=== Testing BBC Delap Story Fact Grounding ===")
    print("SOURCE_TEXT:\n", source_text, "\n")

    res = process_raw_news(
        raw_title=raw_title,
        raw_summary=raw_summary,
        source_name=source_name,
        suggested_category="Sports",
        source_url=source_url
    )

    print("--- GENERATED OUTPUT ---")
    print("Headline:", res.get("headline"))
    print("Category:", res.get("category"))
    print("Meta Description:", res.get("meta_description"))
    print("Key Points:", res.get("key_points"))
    print("Confidence:", res.get("confidence"))
    print("Body:\n", res.get("body"))
    print("\nWhy It Matters:\n", res.get("why_it_matters"))

    # Test explicit checks requested by user
    full_output = f"{res.get('headline')} {res.get('meta_description')} {' '.join(res.get('key_points', []))} {res.get('body')} {res.get('why_it_matters')}".lower()

    has_2_1 = "2-1" in full_output or "2 - 1" in full_output
    has_second_half = "second half" in full_output
    has_saturday = "saturday" in full_output
    has_two_points = "two points" in full_output
    has_3_1 = "3-1" in full_output or "3 - 1" in full_output or "three" in full_output

    print("\n--- USER CONSTRAINTS VERIFICATION ---")
    print(f"Does output invent '2-1'? {has_2_1} (MUST be False)")
    print(f"Does output invent 'second half'? {has_second_half} (MUST be False)")
    print(f"Does output invent 'Saturday'? {has_saturday} (MUST be False)")
    print(f"Does output invent 'two points'? {has_two_points} (MUST be False)")
    print(f"Does output reflect 3-1 score if score mentioned? {has_3_1}")

    is_valid, unverified = verify_output_facts(res, source_text)
    print(f"Strict Fact Verification Passed: {is_valid}")
    print(f"Unverified entities: {unverified}")

    assert not has_2_1, "FAILED: Output invented '2-1'!"
    assert not has_second_half, "FAILED: Output invented 'second half'!"
    assert not has_saturday, "FAILED: Output invented 'Saturday'!"
    assert not has_two_points, "FAILED: Output invented 'two points'!"
    assert is_valid, f"FAILED: Unverified entities remaining: {unverified}"

    print("\n✅ ALL DELAP GROUNDING TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_delap()

