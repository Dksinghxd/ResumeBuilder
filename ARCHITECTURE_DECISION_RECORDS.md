# Architecture Decision Records (ADRs)

This document records major architectural decisions made in the Resume Builder project, including context, rationale, and trade-offs.

---

## ADR-001: Monolithic Architecture (vs. Microservices)

**Date:** Initial development

**Status:** ✅ Accepted, with migration path planned

### Context
Building a new product with uncertain requirements. Need fast iteration and low operational complexity.

### Decision
Use a **monolithic architecture** with a single Node.js/Express backend and React frontend.

### Rationale
- **Speed to market:** Single codebase, single deployment
- **Cost:** Single server, lower operational overhead
- **Simplicity:** Fewer moving parts = fewer things to debug
- **Team size:** Works well with small teams (1-5 engineers)

### Alternatives Considered
1. **Microservices:** More complex, better for teams >10, overkill for MVP
2. **Serverless:** Good for event-driven workloads, but resume creation is request-response
3. **Monolithic with multiple services:** Middle ground, but still complex

### Trade-offs
- ✅ **Faster time to market**
- ✅ **Simpler deployment**
- ❌ **Harder to scale individual components** (e.g., CPU-heavy resume generation)
- ❌ **Single point of failure** (one backend instance down = entire system down)
- ❌ **Harder for team scaling** (beyond 10 engineers, coordination becomes difficult)

### Migration Path
As the system grows:
1. **Stage 1 (10k users):** Add caching layer (Redis), optimize queries
2. **Stage 2 (100k users):** Extract services (auth, resume-generation, sharing)
3. **Stage 3 (1M+ users):** Full microservices with event-driven architecture

### Related Decisions
- ADR-002 (Node.js for backend)
- ADR-004 (Docker containerization)

---

## ADR-002: Node.js/Express for Backend

**Date:** Initial development

**Status:** ✅ Accepted

### Context
Need a backend that can handle real-time updates, file generation, and database operations. Team familiar with JavaScript.

### Decision
Use **Node.js with Express.js** framework for the backend API.

### Rationale
- **Team skills:** JavaScript is common, learning curve minimal
- **Ecosystem:** npm has 2M+ packages, easy to find solutions
- **Performance:** Good for I/O-heavy workloads (API, database)
- **Speed to develop:** Express is minimal and flexible
- **Type safety:** Can use TypeScript for enterprise features

### Alternatives Considered
1. **Python/Django:** Slower to start, heavier framework
2. **Java/Spring:** Enterprise-grade but heavy for MVP
3. **Go:** Great performance, but smaller team ecosystem
4. **Rust:** Excellent performance, but steep learning curve

### Trade-offs
- ✅ **Fast development iteration**
- ✅ **Large ecosystem**
- ✅ **Easy team onboarding**
- ✅ **Good for API development**
- ❌ **Lower performance than Go/Rust** (for CPU-intensive tasks)
- ❌ **Less enterprise-ready than Java**

### Performance Consideration
For CPU-intensive tasks (resume generation, PDF export), consider:
- Offloading to worker processes
- Using native addons (C++ for PDF generation)
- Migrating those services to a faster language if needed

---

## ADR-003: MongoDB for Database

**Date:** Initial development

**Status:** ✅ Accepted, with Postgres alternative considered for future

### Context
Resume data has flexible schema (different resume formats, custom fields). Need fast iteration on data model.

### Decision
Use **MongoDB** as the primary database with Mongoose for schema validation.

### Rationale
- **Schema flexibility:** Can iterate quickly without migrations
- **Document model:** Resumes naturally map to JSON documents
- **Developer experience:** Easy to get started
- **Scalability:** Built-in horizontal scaling (sharding)

### Alternatives Considered
1. **PostgreSQL:** More structured, ACID guarantees, but requires migrations
2. **DynamoDB:** Managed, but vendor lock-in, harder to query
3. **Firestore:** Managed, real-time, but expensive for our use case

### Trade-offs
- ✅ **Fast iteration on schema**
- ✅ **Natural JSON mapping**
- ✅ **Easy horizontal scaling**
- ❌ **Weaker consistency guarantees** (eventual consistency)
- ❌ **No ACID transactions** (until recently, still limited)
- ❌ **Requires careful indexing** for performance

### Migration Path
If requirements change:
- **Stage 1:** Add read replicas for scaling reads
- **Stage 2:** Consider PostgreSQL if transaction requirements grow
- **Stage 3:** Evaluate specialized databases (TimeSeriesDB for analytics)

### Recommendation
For future projects, **PostgreSQL might be better** unless schema flexibility is truly critical.

---

## ADR-004: Docker for Containerization

**Date:** Mid-development

**Status:** ✅ Accepted, with Kubernetes planned

### Context
Need to run the same application consistently across development, staging, and production.

### Decision
Use **Docker** to containerize both backend and frontend applications.

### Rationale
- **Consistency:** "Works on my machine" problem solved
- **Reproducibility:** Can rebuild exact same environment
- **Dependency isolation:** No system package conflicts
- **Container orchestration ready:** Easy path to Kubernetes later

### Alternatives Considered
1. **Virtual machines:** Too heavy, slower startup
2. **Direct installation:** Fragile, hard to reproduce
3. **Serverless:** Doesn't work for our stateful services

### Trade-offs
- ✅ **Environment consistency**
- ✅ **Easy scaling** (run more containers)
- ✅ **Easy rollback** (switch image tags)
- ❌ **Small overhead** (container startup ~2 seconds)
- ❌ **Requires container registry** (Docker Hub, ECR, etc.)
- ❌ **Debugging harder** (can't SSH into container easily)

### Implementation Details
- **Base images:** 
  - Backend: Node 20 Alpine (small, secure)
  - Frontend: Node 22 Alpine (required for latest pnpm)
- **Multi-stage builds:** Optimize for size and security
- **Non-root user:** Run containers as unprivileged user

---

## ADR-005: Docker Compose for Local Development & Single-Host Production

**Date:** Mid-development

**Status:** ✅ Accepted for MVP, plan migration to Kubernetes

### Context
Need simple, reproducible local development environment. Initial production deployment on single host.

### Decision
Use **Docker Compose** for orchestration.

### Rationale
- **Simplicity:** Simple YAML syntax, easy to understand
- **Local development:** Perfect for development environment
- **Single-host production:** Works well for MVP (one instance of each service)
- **No learning curve:** Docker Compose is immediately understandable

### Alternatives Considered
1. **Kubernetes:** More powerful, but overkill for MVP
2. **Docker Swarm:** Middle ground, less popular than Kubernetes
3. **ECS:** AWS-specific, harder to move later

### Trade-offs
- ✅ **Very simple**
- ✅ **Great for development**
- ✅ **Works for single-host production**
- ❌ **Not scalable beyond single host**
- ❌ **No advanced orchestration** (rolling updates, auto-scaling)
- ❌ **No built-in health management**

### Migration Path
1. **Stage 1 (100k+ users):** Migrate from docker-compose to Kubernetes
2. **Stage 2:** Use Helm for package management
3. **Stage 3:** Add service mesh (Istio) for advanced traffic management

---

## ADR-006: GitHub Actions for CI/CD

**Date:** Late development

**Status:** ✅ Accepted

### Context
Need automated build, test, and deployment pipeline. Already using GitHub.

### Decision
Use **GitHub Actions** for CI/CD workflow.

### Rationale
- **Native integration:** No separate tool to manage
- **Generous free tier:** 2000 minutes/month free
- **Community actions:** Thousands of pre-built actions available
- **Easy setup:** YAML workflow files in repository

### Alternatives Considered
1. **Jenkins:** More powerful, but requires server management
2. **GitLab CI:** Excellent, but would require migrating repository
3. **CircleCI:** Good, but SaaS with cost
4. **Travis CI:** Aging, less popular than GitHub Actions now

### Trade-offs
- ✅ **No server to manage**
- ✅ **Free tier generous**
- ✅ **Native GitHub integration**
- ✅ **Community-driven actions**
- ❌ **Limited customization** (compared to Jenkins)
- ❌ **Vendor lock-in** (but using GitHub anyway)

### Parallel Decision: Jenkins as Alternative
Also created **Jenkinsfile** for teams that prefer Jenkins. Can switch by:
- Setting up Jenkins server
- Running webhook integration
- Same workflow logic, different runner

---

## ADR-007: Next.js for Frontend

**Date:** Initial development

**Status:** ✅ Accepted

### Context
Building a React application with SSR, static generation, and built-in tooling needs.

### Decision
Use **Next.js** framework for frontend.

### Rationale
- **Built-in optimization:** Image optimization, code splitting, etc.
- **File-based routing:** Intuitive structure
- **API routes:** Can prototype backend endpoints quickly
- **React ecosystem:** Largest component library (shadcn/ui, etc.)
- **Performance:** Automatic code splitting and optimization
- **SEO-friendly:** SSR support built-in

### Alternatives Considered
1. **React (bare):** Requires more tooling setup
2. **Vue.js:** Good, but smaller ecosystem
3. **Svelte:** Modern, but smaller community

### Trade-Offs
- ✅ **Great DX** (developer experience)
- ✅ **Built-in optimization**
- ✅ **Large ecosystem**
- ✅ **Good performance**
- ❌ **Node.js runtime required** (can't serve as pure static)
- ❌ **Bigger bundle** (compared to Svelte)

---

## ADR-008: TypeScript for Type Safety

**Date:** Mid-development

**Status:** ✅ Accepted

### Context
Codebase growing, need to prevent type-related bugs before production.

### Decision
Migrate to **TypeScript** for both backend and frontend.

### Rationale
- **Catch bugs early:** Type errors caught at compile time
- **Better IDE support:** IntelliSense and refactoring
- **Self-documenting code:** Types are documentation
- **Enterprise readiness:** Reduces bugs in production
- **Team scaling:** Easier for new team members to understand code

### Trade-offs
- ✅ **Fewer bugs**
- ✅ **Better IDE support**
- ✅ **Self-documenting**
- ✅ **Scales better**
- ❌ **Build step required**
- ❌ **Slightly more verbose**
- ❌ **Learning curve** for developers

### Configuration
- `tsconfig.json` configured with strict mode enabled
- Compiler options tuned for production readiness

---

## ADR-009: MongoDB Replica Set for High Availability

**Date:** Production hardening phase

**Status:** 🔄 Recommended (not yet implemented)

**ADR-001-Migration-Step**

### Context
Single MongoDB instance is a single point of failure. Need reliability for production.

### Decision
Implement **MongoDB Replica Set** (minimum 3 nodes).

### Rationale
- **High availability:** If one node fails, others take over
- **Read scaling:** Can read from replicas
- **Automatic failover:** No manual intervention needed
- **Data safety:** Replication provides backup

### Trade-offs
- ✅ **High availability**
- ✅ **Read scaling**
- ✅ **Automatic failover**
- ❌ **More complex** (3+ servers needed)
- ❌ **Higher cost** (3x database cost)
- ❌ **Operational overhead**

### Implementation Recommendation
For production deployment:
1. Deploy 3-node MongoDB replica set
2. Or use MongoDB Atlas (managed service, no ops overhead)
3. Configure read preference (primary, primaryPreferred, etc.)
4. Monitor replica set health

---

## ADR-010: Prometheus + Grafana for Monitoring

**Date:** Production hardening phase

**Status:** 🔄 Recommended (partially implemented)

### Context
Can't operate system without observability. Need metrics, logging, and alerting.

### Decision
Use **Prometheus** for metrics collection and **Grafana** for visualization/alerting.

### Rationale
- **Industry standard:** Most companies use Prometheus + Grafana
- **Open source:** Free, no licensing costs
- **Powerful alerting:** AlertManager provides flexible alerting
- **Wide adoption:** Lots of community dashboards and examples

### Trade-offs
- ✅ **No licensing cost**
- ✅ **Industry standard**
- ✅ **Great community**
- ✅ **Easy to extend**
- ❌ **Requires operational setup**
- ❌ **Doesn't scale to very large deployments** (need Thanos)

### Scale Considerations
- For <100k metrics: Single Prometheus instance fine
- For 100k-1M metrics: Consider HA Prometheus setup
- For >1M metrics: Use Thanos for long-term storage

---

## ADR-011: GitOps for Deployment (Recommended Future)

**Date:** Not yet implemented

**Status:** 🔄 Planned improvement

### Context
SSH-based deployment is fragile and doesn't scale. Need safer, more auditable deployments.

### Decision
Migrate from SSH deployment to **GitOps** (Argo CD or Flux).

### Rationale
- **Git as source of truth:** All deployment state in Git
- **Audit trail:** Every deployment visible in Git history
- **Easy rollback:** Just revert Git commit
- **Collaborative:** PRs for deployment changes
- **Security:** No secrets on developer machines

### Alternatives Considered
1. **Jenkins pipeline:** More complex, requires more management
2. **Terraform/IaC:** Good but not deployment-focused
3. **Manual updates:** Fragile and doesn't scale

### Trade-offs
- ✅ **Safer deployments**
- ✅ **Audit trail**
- ✅ **Easy rollback**
- ✅ **Team collaboration**
- ❌ **Learning curve**
- ❌ **More tool setup**

### Recommended Tools
- **Argo CD:** Kubernetes-focused, very powerful
- **FluxCD:** Alternative to Argo, slightly simpler

---

## ADR-012: Infrastructure as Code (Recommended Future)

**Date:** Not yet implemented

**Status:** 🔄 Planned improvement

### Context
Current infrastructure is manual and hard to reproduce. Need infrastructure in code.

### Decision
Use **Terraform** to define all infrastructure.

### Rationale
- **Reproducibility:** Can spin up identical environments
- **Version control:** Infrastructure changes tracked in Git
- **Documentation:** Infrastructure is self-documenting
- **Safety:** Plan before apply, safe rollback
- **Scaling:** Easy to clone infrastructure for new environments

### Alternatives Considered
1. **CloudFormation:** AWS-specific
2. **Pulumi:** Great but newer, less community support
3. **Manual setup:** Not scalable

### Trade-offs
- ✅ **Reproducible infrastructure**
- ✅ **Version controlled**
- ✅ **Safe changes**
- ✅ **Great for scaling**
- ❌ **Learning curve**
- ❌ **Operational overhead**

---

## Summary: Current vs. Future State

### Current Architecture (MVP)
```
┌─ Development ─┐
│ docker-compose│ (single host)
│ MongoDB       │
│ Express/Node  │
│ Next.js       │
└───────────────┘
         ↓
    CI/CD (GitHub Actions)
         ↓
┌─ Production ──┐
│ Single Server │
│ Docker        │
│ Nginx Proxy   │
└───────────────┘
```

**Status:** Works for MVP (0-10k users)

### Recommended Future Architecture (Scale)
```
┌─ Development ─────────────────┐
│ Kubernetes (local or kind)     │
│ MongoDB Atlas                   │
│ Multiple services (microsvcs)  │
└───────────────────────────────┘
         ↓
  CI/CD (GitHub Actions)
         ↓
  GitOps (Argo CD)
         ↓
┌─ Production ──────────────────┐
│ Kubernetes (EKS/GKE/AKS)       │
│ Managed MongoDB (Atlas)        │
│ Service Mesh (Istio)           │
│ Distributed Tracing            │
│ Full Observability             │
└───────────────────────────────┘
```

**Status:** Plan for 100k+ users

---

## Decision-Making Framework

When making architecture decisions, consider:

1. **Current Constraints**
   - Budget (MVPs should be cheap)
   - Team size (MVPs use smaller teams)
   - Timeline (MVPs prioritize speed)
   - Expertise (use what team knows)

2. **Growth Path**
   - Is this decision easily reversible?
   - Can we migrate later?
   - What are the scaling limitations?

3. **Trade-offs**
   - Speed vs. reliability?
   - Simplicity vs. features?
   - Cost vs. performance?

4. **Long-term Vision**
   - Where do we want to be in 12 months?
   - What decisions enable that future?
   - Are we building on solid foundations?

---

## Conclusion

Each architectural decision made reflects the **current stage** of the project:
- MVP stage: Optimize for speed and simplicity
- Growth stage: Add reliability and scalability
- Scale stage: Full enterprise architecture

The roadmap above provides a clear migration path for each stage without requiring complete rewrites.

**Remember:** Perfect architecture is the enemy of shipped products. Good enough with a migration path is better than perfect with no users.
