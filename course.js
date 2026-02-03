(function () {
  "use strict";

  const SECTION_IDS = ["hero", "about", "course-info", "schedule", "readings", "resources", "instructor", "team"];

  // ----- Smooth scroll & active section -----
  function initNav() {
    const navLinks = document.querySelectorAll('.nav-link, .hero-cta');
    navLinks.forEach(function (a) {
      if (!a.getAttribute('href') || !a.getAttribute('href').startsWith('#')) return;
      a.addEventListener('click', function (e) {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          if (!SECTION_IDS.includes(id)) return;
          document.querySelectorAll('.nav-link').forEach(function (link) {
            const href = link.getAttribute('href') || '';
            if (href === '#' + id) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    SECTION_IDS.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // ----- Scroll-triggered in-view (about blocks, schedule rows) -----
  function initScrollReveal() {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0 }
    );
    document.querySelectorAll('.about-block').forEach(function (el) {
      revealObserver.observe(el);
    });
    document.querySelectorAll('#schedule-table tbody tr').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ----- D3 Hero viz: animated flowing lines -----
  function initHeroViz() {
    const container = document.getElementById('hero-viz');
    if (!container) return;
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const n = 12;
    const data = d3.range(n).map(function (_, i) {
      return {
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.15 + Math.random() * 0.2,
        vy: 0.1 + Math.random() * 0.15
      };
    });
    const line = d3.line().x(function (d) { return d.x; }).y(function (d) { return d.y; }).curve(d3.curveCatmullRom.alpha(0.5));
    const path = svg.append('path')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(240, 180, 41, 0.25)')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round');
    function tick() {
      data.forEach(function (d) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > width) d.vx *= -1;
        if (d.y < 0 || d.y > height) d.vy *= -1;
      });
      const sorted = [...data].sort(function (a, b) { return a.x - b.x; });
      path.datum(sorted).attr('d', line);
    }
    d3.interval(tick, 50);
    tick();
  }

  // ----- Grade breakdown bar chart (D3, scroll-triggered) -----
  const GRADE_DATA = [
    { label: 'Paper presentation', value: 15 },
    { label: 'Paper summarization', value: 15 },
    { label: 'Research proposal', value: 20 },
    { label: 'Class engagement', value: 10 },
    { label: 'Programming HWs', value: 40 }
  ];

  function drawGradeChart() {
    const el = document.getElementById('grade-chart');
    if (!el) return;
    const width = Math.min(el.offsetWidth, 500);
    const height = 200;
    const margin = { top: 10, right: 20, bottom: 30, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    d3.select(el).selectAll('*').remove();
    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('aria-hidden', 'true');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([0, 50]).range([0, innerWidth]);
    const yScale = d3.scaleBand()
      .domain(GRADE_DATA.map(function (d) { return d.label; }))
      .range([0, innerHeight])
      .padding(0.25);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(function (d) { return d + '%'; }))
      .selectAll('text, line, path')
      .attr('stroke', 'currentColor')
      .style('fill', '#8b9cad')
      .style('font-size', '12px');
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll('text')
      .style('fill', '#e6edf3')
      .style('font-size', '13px');
    const bars = g.selectAll('.bar')
      .data(GRADE_DATA)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', function (d) { return yScale(d.label); })
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('fill', '#f0b429')
      .attr('rx', 3);
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          bars.transition().duration(800).ease(d3.easeCubicOut).attr('width', function (d) { return xScale(d.value); });
          io.disconnect();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
  }

  // ----- Force-directed graph (Readings) -----
  function initForceGraph() {
    const container = document.getElementById('readings-viz');
    if (!container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    if (!width || !height) return;
    d3.csv('paper.csv').then(function (raw) {
      const links = raw.map(function (d) {
        return { source: d.source, target: d.target, value: +d.value };
      });
      const nodeMap = {};
      links.forEach(function (link) {
        if (!nodeMap[link.source]) nodeMap[link.source] = { name: link.source };
        if (!nodeMap[link.target]) nodeMap[link.target] = { name: link.target };
      });
      links.forEach(function (link) {
        link.source = nodeMap[link.source];
        link.target = nodeMap[link.target];
      });
      const nodes = Object.values(nodeMap);
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (d) { return d.name; }).distance(90))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('x', d3.forceX(width / 2))
        .force('y', d3.forceY(height / 2))
        .force('collision', d3.forceCollide().radius(20));
      const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
      const link = svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('class', function (d) { return 'link' + (d.value === 0 ? ' similar' : ''); })
        .attr('stroke', function (d) { return d.value === 0 ? 'rgba(139, 156, 173, 0.8)' : 'rgba(126, 184, 218, 0.5)'; })
        .attr('stroke-width', function (d) { return d.value === 0 ? 2 : 1; })
        .attr('stroke-dasharray', function (d) { return d.value === 1 ? '4 3' : 'none'; });
      const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', function (event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x;
            d.fy = d.y;
          }));
      nodes.forEach(function (d) {
        d.weight = links.filter(function (l) { return l.source === d || l.target === d; }).length;
      });
      const minR = 4;
      const maxR = 14;
      const rScale = d3.scaleSqrt().domain([0, d3.max(nodes, function (d) { return d.weight; })]).range([minR, maxR]);
      node.append('circle')
        .attr('r', function (d) { return rScale(d.weight); })
        .attr('fill', function (d) {
          if (d.weight < 2) return 'rgba(240, 180, 41, 0.5)';
          if (d.weight < 5) return 'rgba(240, 180, 41, 0.75)';
          return '#f0b429';
        })
        .attr('stroke', '#1c242e')
        .attr('stroke-width', 1.5);
      node.append('text')
        .attr('dx', 12)
        .attr('dy', 4)
        .attr('fill', '#e6edf3')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(function (d) { return d.name; });
      function ticked() {
        link.attr('d', function (d) {
          var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
          return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
        });
        node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
      }
      simulation.on('tick', ticked);
    }).catch(function (err) {
    });
  }

  // ----- Schedule: optional D3 timeline (we use table + row stagger only) -----
  function initSchedule() {
    initScrollReveal();
  }

  // ----- Readings list from external CSV -----
  const READINGS_CSV_URL = 'https://raw.githubusercontent.com/fuyuGT/CS7450-data/main/hw2-papers.csv';

  function initReadingsList() {
    const container = document.getElementById('readings-list');
    if (!container) return;
    d3.csv(READINGS_CSV_URL).then(function (data) {
      const topics = [];
      data.forEach(function (d) {
        const key = 'Week ' + (d['Week '] || '').trim() + ' - ' + (d.Topic || '').trim();
        d.week_topic = key;
        if (key && topics.indexOf(key) === -1) topics.push(key);
      });
      container.innerHTML = '';
      topics.forEach(function (topic) {
        const papers = data.filter(function (d) { return d.week_topic === topic; });
        const topicEl = document.createElement('p');
        topicEl.className = 'topic';
        topicEl.textContent = topic;
        container.appendChild(topicEl);
        const ul = document.createElement('ul');
        ul.className = 'topic-div';
        papers.forEach(function (p) {
          const li = document.createElement('li');
          const date = (p.Date || '').trim();
          const title = (p.Paper || '').trim();
          const link = (p.Link || '').trim();
          li.innerHTML = date + ' – ' + title;
          if (link) {
            const a = document.createElement('a');
            a.href = link;
            a.rel = 'noopener noreferrer';
            a.target = '_blank';
            a.textContent = ' (Link)';
            li.appendChild(a);
          }
          ul.appendChild(li);
        });
        container.appendChild(ul);
      });
    }).catch(function () {
      container.innerHTML = '<p class="readings-intro">Paper list could not be loaded. See Canvas for readings.</p>';
    });
  }

  // ----- Init when DOM ready -----
  function init() {
    initNav();
    initScrollReveal();
    initHeroViz();
    drawGradeChart();
    initReadingsList();
    initForceGraph();
    initSchedule();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
