export const siteConfig = {
  name: "Samba Siva Reddy",
  title: "Samba Siva Reddy - Software Engineer",
  description:
    "Database engineer at Zoho Corporation working on core PostgreSQL internals and distributed systems. Experienced in query optimization, PostgreSQL, and full-stack web development.",
  url: "https://sambasivareddy.up.railway.app",
  ogImage: "https://sambasivareddy.up.railway.app/og.png",
  links: {
    github: "https://github.com/samsiva-dev",
    linkedin: "https://www.linkedin.com/in/samba-siva-reddy-ch",
    twitter: "https://twitter.com/itzsamscc",
    email: "sambasivareddychinta@gmail.com",
  },
  author: {
    name: "Samba Siva Reddy",
    email: "sambasivareddychinta@gmail.com",
    title: "Member Technical Staff @ Zoho | PostgreSQL & Distributed Systems",
    bio: "Database engineer at Zoho Corporation working on core PostgreSQL internals — Planner, Executor, COPY framework, and connection management — to power a distributed database architecture. Passionate about query optimization, distributed systems, and building scalable full-stack web applications.",
    location: "Chennai, India",
    avatar: "/images/avatar.jpg",
  },
  navLinks: [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" },
    { title: "Projects", href: "/projects" },
    { title: "Blog", href: "/blog" },
    { title: "Contact", href: "/contact" },
  ],
};

export const projects = [
  {
    id: "travel-journal",
    title: "E-Travel Journal",
    link: "https://travel.sambasivareddy.in/",
    gitlink: "https://github.com/samsiva-dev/traveller",
    description:
      "A Web application to keep the track/journal of the trips you went till now and plans for the upcoming trips. It also visualize the trips you want in the map",
    tags: ["React.js", "CSS", "JavaScript"],
    status: "Completed",
    preview: true,
  },
  {
    id: "dbu",
    title: "Distributed Postgres Join Optimizer",
    link: "https://github.com/samsiva-dev/distributed-pg-stats/releases/tag/v1.0.0",
    gitlink: "https://github.com/samsiva-dev/distributed-pg-stats",
    description:
      "A tool to build the global NDV (Number of Distinct Values) stats, load them and use them to give the optimal join order based on the given query.",
    tags: ["PostgreSQL", "Optimizer", "PG Extension", "Go", "Cobra", "CLI"],
    status: "Completed",
    preview: true,
  },
  {
    id: "project1",
    title: "Blog Page",
    link: "https://blogs.sambasivareddy.in/",
    gitlink: "https://github.com/samsiva-dev/writes-by-siva",
    description:
      "This is a full-stack blogging application designed to share technical articles, coding solutions, and developer-focused blogs. It covers trending topics in software development such as MERN stack, and modern engineering practices. The blog section includes detailed posts on system design and core computer science concepts, while the coding section focuses on competitive programming with practical solutions and explanations. Each post is structured for clarity and usefulness, helping readers quickly grasp key ideas.",
    tags: ["React.Js", "Next.js", "CSS", "Node.js", "Express.js", "PostgreSQL", "Redis"],
    status: "Completed",
    preview: true,
    frontend: [
      "A Simple Web App for my technical & personal writing",
      "✅ Tag-Based Filtering: Match (all/any) selected blogs",
      "🔗 Easy Link Sharing: Share posts seamlessly with others",
      "🚀 SEO-Friendly Design",
      "📄 Pagination Support: Navigate through large number of posts at ease",
      "👍 Likes & Views Tracking: Engage with blogs and track popularity",
      "✨ TL;DR Summaries: Quick highlights for faster reading",
      "📩 Newsletter Subscription: Stay updated with the latest blogs",
      "🔎 Debounced Search: Search across the large number of posts with keywords",
      "🌙 Switch between the light and dark themes at your convenience.",
      "🥳 Users can react to the blog with following emojis ❤️, 😂, 🔥, 😡",
      "✔️ User can sort the blogs based on 'Blog Post (Asc/Desc), Most Viewed, Most Reacted'.",
      "📩 User's can now add the comments to each blog (powered by Remarks42) hosted by ourselves, so data will be with us.",
      "→ To add the comments, user should be login using their Gmail/Github to moderate the spam comments.",
    ],
    backend: [
      "🛠️ Personalized Dashboard: Efficiently post and manage blogs",
      "🔄 Reset & Visibility Controls: Update blog details with ease",
      "📊 Application Stats: Track views, likes, and newsletter performance",
      "📩 Newsletter Subscription: Sending mails to the subscribers on every new Blog",
      "📣 Discord Notifications on post and login details of Admin who loggedin into the Page",
    ],
    insights: {
      performance: "99",
      accessibility: "100",
      bestPractices: "96",
      seo: "100",
    },
  },
  {
    id: "project3",
    title: "NextBuy",
    link: "https://e-nextbuy.vercel.app/",
    gitlink: "https://github.com/samsiva-dev/nextbuy",
    description:
      "A Single Page E-Commerce Application which allows the users perform adding products to cart, wishlist and checkout the products. (Currently It's static one with some statically generated data)",
    tags: ["React (TS)", "Redux", "Router", "MockAPI"],
    status: "Completed",
    preview: true,
  },
  {
    id: "project4",
    title: "Database Backup Utility",
    link: "https://github.com/samsiva-dev/db_backup_utility/releases/tag/v1.0.0",
    gitlink: "https://github.com/samsiva-dev/db_backup_utility",
    description:
      "A CLI tool which helps to perform Backup, restore on database likes Postgres, SQL and also helps to automate the backup job",
    tags: ["Go", "Cobra", "CLI"],
    status: "Completed",
    preview: true,
  },
  {
    id: "project5",
    title: "Meeting Notes",
    link: "https://meeting-notes-phi.vercel.app/",
    gitlink: "https://github.com/samsiva-dev/meeting_notes",
    description:
      "An Application which helps to take notes on various scheduled meeting in your google calender.",
    tags: ["React.js", "Go Language", "Postgres", "Gin"],
    status: "Completed",
    preview: true,
  },
  {
    id: "project6",
    title: "Event Management REST API",
    link: "",
    gitlink: "https://github.com/samsiva-dev/rest_api_go",
    description:
      "An Event Management API helps in creating, deleting and updating an event. And supports user registration to the events",
    tags: ["Go", "Gin", "REST API", "SQLite3"],
    status: "Completed",
    preview: false,
  },
  {
    id: "project7",
    title: "Club Manager",
    link: "https://eclub-manager.vercel.app/",
    gitlink: "https://github.com/samsiva-dev/club_manager",
    description:
      "An application which allows the manage the different clubs effectively without conflicting the Events",
    tags: ["React.js", "Express.js", "MongoDB", "REST API", "Redux"],
    status: "Completed",
    preview: false,
    features: [
      "An application built with three-user architecture i.e user, manager, admin",
      "Admin can ables to create a new club and add a manager to it and can delete the club if needed",
      "Once the manager is added, We will send an email with Password to login into the web application",
      "Manager can add the club members, events and edit club related to that Club",
      "In the home page, we summarize all the clubs and events related to that organization",
    ],
  },
];

export const skills = [
  { category: "CS Core Concepts", items: ["Data Structures", "DBMS", "System Design", "Database Internals"] },
  { category: "Languages", items: ["JavaScript", "Go", "Python", "C++", "Java", "HTML", "CSS"] },
  { category: "Frameworks & Libraries", items: ["React.js", "Node.js", "Express.js", "Go Gin", "Next.js"] },
  { category: "Databases", items: ["PostgreSQL", "SQL", "MongoDB"] },
  { category: "DevOps & Tools", items: ["Docker", "Kubernetes", "Git", "Linux"] },
];

export const experience = [
  {
    title: "Member Technical Staff",
    company: "Zoho Corporation",
    location: "Chennai, India",
    period: "Jan 2023 – Present",
    description:
      "Working on core PostgreSQL internals including the Planner, Executor, COPY framework, and connection management to support Zoho's distributed database architecture, ensuring correctness, scalability, and performance.",
    highlights: [
      "Designed and implemented a cursor-based pagination system inspired by NoSQL access patterns, eliminating OFFSET-based inefficiencies and enabling efficient, scalable pagination across distributed shards.",
      "Developed a PostgreSQL extension to cache join orders using queryId, reducing planning overhead for complex queries (8+ joins) while preserving cost-based optimization behavior.",
      "Upgraded critical database internals by migrating Planner and Executor modules from PostgreSQL 11.4 to 17.2, ensuring long-term compatibility with the evolving open-source ecosystem.",
      "Optimized the COPY framework for high-throughput data transfer, integrating SCP and Netcat with LZ4/Snappy compression, achieving up to 1.5× improvement in query execution performance.",
      "Designed and executed a zero-downtime PostgreSQL cluster migration using a Blue-Green deployment strategy, ensuring uninterrupted production traffic while transitioning between major PostgreSQL versions.",
      "Introduced three new transactional consistency modes, providing developers fine-grained control over query execution in scenarios involving cache invalidation.",
      "Integrated PostgreSQL join optimization techniques into the distributed architecture to improve join query execution efficiency across the system.",
      "Diagnosed and resolved critical planner, executor, and distributed execution bugs, improving system stability, correctness, and production reliability.",
      "Built a query generation and validation framework that auto-generates distribution-aware queries, executes them across cluster configurations, and validates correctness via CI/CD-integrated checks.",
      "Built a query validation system to compare execution results across old and new PostgreSQL clusters and Blue-Green deployment environments, ensuring correctness during upgrades and schema evolution.",
      "Investigated and fixed distributed query performance issues including excessive memory usage from unnecessary shard execution, connection congestion during inter-node COPY operations — resolved by optimizing shard targeting and introducing SCP + LZ4-based transfer pipelines.",
    ],
    coreSkills: ["Database Internals", "PostgreSQL", "Distributed Systems", "Query Optimization", "Python"],
  },
];
