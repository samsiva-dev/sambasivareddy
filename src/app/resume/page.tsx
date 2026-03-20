import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig, skills, experience } from "@/lib/constants";
import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${siteConfig.author.name} - ${siteConfig.author.title}`,
};

export default function ResumePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{siteConfig.author.name}</h1>
            <p className="text-lg text-muted-foreground">{siteConfig.author.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{siteConfig.author.location}</p>
          </div>
          {/* <Button variant="outline" asChild>
            <Link href="/resume.pdf" target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </Button> */}
        </div>

        {/* Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-4 pb-2 border-b">Summary</h2>
          <p className="text-muted-foreground leading-relaxed">{siteConfig.author.bio}</p>
        </section>

        {/* Experience */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6 pb-2 border-b">Experience</h2>
          <div className="space-y-8">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold">{exp.title}</h3>
                  <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                    {exp.period}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-primary">{exp.company}</span>
                  {exp.location && (
                    <span className="text-muted-foreground">• {exp.location}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 space-y-1.5">
                    {exp.highlights.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                )}
                {exp.coreSkills && exp.coreSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {exp.coreSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6 pb-2 border-b">
            Technical Skills
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {skills.map((skill) => (
              <div key={skill.category}>
                <h3 className="text-sm font-semibold mb-2">{skill.category}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skill.items.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6 pb-2 border-b">Education</h2>
          <div>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold">Bachelor of Technology in Computer Science</h3>
              <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                2019 - 2023
              </span>
            </div>
            <div className="text-sm text-primary">Gayatri Vidyaparishad College of Engineering</div>
          </div>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-xl font-bold tracking-tight mb-4 pb-2 border-b">Links</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                GitHub <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={siteConfig.url} target="_blank" rel="noopener noreferrer">
                Website <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
