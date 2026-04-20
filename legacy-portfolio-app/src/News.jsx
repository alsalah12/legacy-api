// React is needed because this component returns JSX.
import React from "react";
// Import the styles used by this widget.
import "./News.css";

// News renders a compact list of headline cards on the dashboard.
export default function News() {
  // Static example data for each news story.
  // In a real app, this would likely come from an API call.
  const newsItems = [
    {
      id: 1,
      title: "Apple rises after stronger quarterly earnings",
      source: "Reuters",
      time: "2h ago",
      summary:
        "Apple shares moved higher after the company reported better-than-expected results.",
      sentiment: "Positive",
    },
    {
      id: 2,
      title: "Tesla adjusts European delivery plans",
      source: "Bloomberg",
      time: "4h ago",
      summary:
        "Tesla is refining regional operations as demand patterns shift across Europe.",
      sentiment: "Neutral",
    },
    {
      id: 3,
      title: "NVIDIA leads tech rally on AI demand",
      source: "Financial Times",
      time: "6h ago",
      summary:
        "Semiconductor stocks gained as investors reacted to continued AI infrastructure growth.",
      sentiment: "Positive",
    },
  ];

  return (
    // The overall card container for the news widget.
    <section className="news-widget">
      {/* Header row with title and placeholder action button. */}
      <div className="news-widget-header">
        <h3>News</h3>
        <button className="news-view-all" type="button">
          View all
        </button>
      </div>

      {/* Map over each story to build one visual card per item. */}
      <div className="news-widget-list">
        {newsItems.map((item) => (
          <article className="news-widget-card" key={item.id}>
            {/* Top row shows the publisher and the sentiment tag. */}
            <div className="news-widget-top">
              <span className="news-source">{item.source}</span>
              <span
                className={`news-sentiment ${item.sentiment.toLowerCase()}`}
              >
                {item.sentiment}
              </span>
            </div>

            {/* Headline and summary text for the story. */}
            <h4>{item.title}</h4>
            <p>{item.summary}</p>

            {/* Footer row with relative time and a placeholder link. */}
            <div className="news-widget-footer">
              <span>{item.time}</span>
              <a href="/">Read more</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}