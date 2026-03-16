import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { siteConfig, skills, experience } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `Learn more about ${siteConfig.author.name}, a software engineer building modern web applications.`,
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About Me</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Software engineer who loves building things that live on the internet.
        </p>

        <div className="prose dark:prose-invert">
          <p>
            I&apos;m {siteConfig.author.name}, a {siteConfig.author.title} based in{" "}
            {siteConfig.author.location}. I specialized in developing distributed database architectures and contributing to PostgreSQL internals. And also building full-stack web applications
            with modern technologies and best practices.
          </p>
          <p>
            With a passion for clean code and user experience, I enjoy tackling complex
            problems and turning them into simple, elegant solutions. I&apos;m particularly
            interested in distributed systems, developer tools, and open-source software.
          </p>
          <p>
            When I&apos;m not coding, you can find me writing technical articles, contributing
            to open-source projects, or exploring new technologies. I believe in continuous
            learning and sharing knowledge with the developer community.
          </p>
        </div>

        {/* Experience */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Experience</h2>
          <div className="space-y-8">
            {experience.map((exp, index) => (
              <div key={index} className="relative pl-6 border-l-2 border-border">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                <div className="mb-1 text-sm text-muted-foreground">{exp.period}</div>
                <h3 className="text-lg font-semibold">{exp.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>{exp.company}</span>
                  {exp.location && <span>• {exp.location}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 space-y-1.5">
                    {exp.highlights.slice(0, 5).map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Skills &amp; Technologies
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {skills.map((skill) => (
              <div key={skill.category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {skill.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skill.items.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
