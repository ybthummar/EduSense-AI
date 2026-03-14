"""Web scraper service — fetches educational content from Wikipedia and documentation sites."""

import requests
from bs4 import BeautifulSoup
from typing import Optional


def scrape_wikipedia(topic: str, max_paragraphs: int = 3) -> Optional[str]:
    """Fetch the first few paragraphs from Wikipedia for a given topic."""
    try:
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + topic.replace(" ", "_")
        response = requests.get(url, timeout=8, headers={"User-Agent": "EduSenseAI/1.0"})
        if response.status_code == 200:
            data = response.json()
            return data.get("extract", "")
    except Exception:
        pass
    return None

def scrape_web_links(query: str, max_results: int = 3) -> list:
    """Return a list of top Wikipedia links for the given topic."""
    links = []
    # Try Wikipedia Search Html
    try:
        search_url = "https://en.wikipedia.org/w/index.php"
        params = {"search": query, "title": "Special:Search", "fulltext": "1"}
        resp = requests.get(search_url, params=params, timeout=8, headers={"User-Agent": "EduSenseAI/1.0"})
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            results = soup.select(".mw-search-result-heading a")
            for res in results[:max_results]:
                href = res.get("href")
                title = res.get_text()
                if href and title:
                    links.append({
                        "title": title,
                        "url": f"https://en.wikipedia.org{href}"
                    })
    except Exception:
        pass
        
    if not links:
        # Fallback to direct page
        links.append({
            "title": f"{query} on Wikipedia",
            "url": "https://en.wikipedia.org/wiki/" + query.replace(" ", "_")
        })
    return links


def scrape_web_content(query: str, max_paragraphs: int = 3) -> str:
    """
    Attempt to retrieve educational text for *query* from Wikipedia.
    Falls back to a generic message when nothing is found.
    """
    # Try Wikipedia REST API first (clean, no HTML parsing needed)
    wiki_text = scrape_wikipedia(query, max_paragraphs)
    if wiki_text:
        return wiki_text

    # Fallback: search Wikipedia HTML page
    try:
        search_url = "https://en.wikipedia.org/w/index.php"
        params = {"search": query, "title": "Special:Search", "fulltext": 1}
        resp = requests.get(search_url, params=params, timeout=8, headers={"User-Agent": "EduSenseAI/1.0"})
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            results = soup.select(".mw-search-result-heading a")
            if results:
                article_url = "https://en.wikipedia.org" + results[0]["href"]
                article_resp = requests.get(article_url, timeout=8, headers={"User-Agent": "EduSenseAI/1.0"})
                if article_resp.status_code == 200:
                    article_soup = BeautifulSoup(article_resp.text, "html.parser")
                    paragraphs = article_soup.select("#mw-content-text .mw-parser-output > p")
                    texts = []
                    for p in paragraphs[:max_paragraphs]:
                        text = p.get_text(strip=True)
                        if text and len(text) > 40:
                            texts.append(text)
                    if texts:
                        return "\n\n".join(texts)
    except Exception:
        pass

    return f"{query} is an important academic topic. Please refer to the recommended videos and course materials for a detailed explanation."
