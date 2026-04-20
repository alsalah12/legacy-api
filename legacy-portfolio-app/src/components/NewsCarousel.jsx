// React and useState are needed because this component tracks which story is active.
import React, { useState } from 'react';
// Import the styles that control the card stack and carousel controls.
import './NewsCarousel.css';

// Static news stories. Later replace with a fetch() to a news API
// or a backend endpoint that returns stories related to the user's holdings.
const STORIES = [
  {
    tag: 'Earnings',
    title: 'AstraZeneca raises full-year guidance after strong oncology demand',
    source: 'Market Bulletin',
    time: '08:15 BST',
    link: '#',
  },
  {
    tag: 'Macro',
    title: 'Bank of England commentary pushes UK financial stocks into focus',
    source: 'Desk Insight',
    time: '09:40 BST',
    link: '#',
  },
  {
    tag: 'Energy',
    title: 'Shell confirms capital returns plan as commodity prices stabilise',
    source: 'Equity Wire',
    time: '11:05 BST',
    link: '#',
  },
];

function NewsCarousel() {
  // activeIndex controls which story is shown as the primary card.
  const [activeIndex, setActiveIndex] = useState(0);

  // Move one story backward, looping to the end if already at the first story.
  const handlePrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? STORIES.length - 1 : current - 1,
    );
  };

  // Move one story forward, looping back to the start when needed.
  const handleNext = () => {
    setActiveIndex((current) =>
      current === STORIES.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <section className="card side-card">
      <div className="side-card-header">
        <p className="card-title">Holdings News</p>
        <p className="card-subtitle">Latest related coverage</p>
      </div>

      <div className="news-carousel">
        {/* Navigation row: arrows on either side, dots in the centre */}
        <div className="news-wheel-indicators">
          <button
            type="button"
            className="wheel-arrow"
            onClick={handlePrevious}
            aria-label="Previous story"
          >
            ‹
          </button>

          <div className="wheel-dots">
            {STORIES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`wheel-dot${index === activeIndex ? ' active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to story ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="wheel-arrow"
            onClick={handleNext}
            aria-label="Next story"
          >
            ›
          </button>
        </div>

        {/* Story cards — active card is full opacity, others are muted */}
        <div className="news-cards-stack">
          {STORIES.map((story, index) => (
            <article
              key={story.title}
              className={`news-card${
                index === activeIndex
                  ? ' news-card-active'
                  : ' news-card-muted'
              }`}
            >
              <span className="news-tag">{story.tag}</span>
              <p className="news-title">{story.title}</p>
              <div className="news-meta">
                <span>{story.source}</span>
                <span>{story.time}</span>
              </div>
              <a href={story.link} className="news-link">
                Read more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NewsCarousel;
