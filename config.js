// Show settings. Edit freely — no build step.
window.CB_CONFIG = {
  // Event details for the title and last screens. Empty fields are simply left out.
  event: {
    title: 'Cloud-Barista 오픈 컨퍼런스', // e.g. '제12회 Cloud-Barista 커뮤니티 오픈 컨퍼런스'
    date: '',      // e.g. '2026년 11월 20일 (목)'
    time: '',      // e.g. '13:30 시작'
    venue: '',     // e.g. '서울 OO홀'
    startTime: '', // e.g. '2026-11-20T13:30:00+09:00' — shows "오프닝까지 MM:SS" in the corner and on the last screen
  },

  // Head Baristas, in this order. `name` is shown large; leave it empty to use the GitHub profile name.
  // Optional `role` adds one line to the card, e.g. { login: 'x', name: '홍길동', role: 'CB-Spider 리드' }.
  // The first eight were chosen by the organisers; the rest are the top contributors by
  // commits + merged PRs across all public repositories (bots and shared team accounts excluded).
  heroes: [
    { login: 'dongjae', name: '강동재' },
    { login: 'powerkimhub', name: '김병섭' },
    { login: 'Youngwoo-Jung', name: '정영우' },
    { login: 'seokho-son', name: '손석호' },
    { login: 'yunkon-kim', name: '김윤곤' },
    { login: 'innodreamer', name: '오병택' },
    { login: 'hanizang77', name: '장한이' },
    { login: 'iworkist', name: '박재홍' },
    { login: 'ish-hcc', name: '' },
    { login: 'jihoon-seo', name: '' },
    { login: 'dev4unet', name: '' },
    { login: 'dogfootman', name: '' },
    { login: 'jazmandorf', name: '' },
    { login: 'sykim-etri', name: '' },
    { login: 'hippo-an', name: '' },
    { login: 'yh-noh', name: '' },
    { login: 'jmleefree', name: '' },
  ],

  // Slides in order. Remove an id to skip that slide. The loop is about 5 minutes with all of them.
  scenes: ['boot', 'title', 'numbers', 'glance', 'years', 'blend', 'bugs', 'menu', 'devlife', 'heroes', 'wall', 'join', 'outro'],

  // The "THANK YOU" ticker of every contributor's name along the bottom of every slide.
  ticker: true,
};
