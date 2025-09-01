# Claude Flow (Hive-Mind) Setup Guide for Development Projects

## 🌟 Overview

Claude Flow v2.0.0 Alpha is an enterprise-grade AI orchestration platform that uses **hive-mind swarm intelligence** to coordinate multiple specialized AI agents for complex development tasks. It features a Queen-led architecture with specialized worker agents that coordinate through shared memory and neural pattern recognition.

## 📋 Prerequisites

### System Requirements
- **Node.js 18+** (LTS recommended)
- **npm 9+** or equivalent package manager
- **WSL2** (for Windows users - fully supported)
- **Git** (for version control integration)

### Required Dependencies
⚠️ **CRITICAL**: Claude Code must be installed first:

```bash
# 1. Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# 2. Activate Claude Code with permissions (required for Claude Flow)
claude --dangerously-skip-permissions
```

## 🚀 Installation Methods

### Method 1: Quick NPX Installation (Recommended for Testing)

```bash
# Install and initialize in one command
npx claude-flow@alpha init --force

# Verify installation
npx claude-flow@alpha --version
# Expected: claude-flow v2.0.0-alpha.53+
```

### Method 2: Global Installation

```bash
# Install globally
npm install -g claude-flow@alpha

# Initialize
claude-flow init

# Verify
claude-flow --version
```

### Method 3: WSL2 Installation (Windows Users)

```bash
# In WSL2 terminal
# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Claude Code
npm install -g @anthropic-ai/claude-code
claude --dangerously-skip-permissions

# Install Claude Flow
npm install -g claude-flow@alpha
claude-flow init
```

## 🐝 Understanding Hive-Mind Architecture

### Core Components

1. **👑 Queen Agent**: Master coordinator and decision maker
2. **🏗️ Architect Agents**: System design and technical architecture
3. **💻 Coder Agents**: Implementation and development
4. **🧪 Tester Agents**: Quality assurance and validation
5. **📊 Analyst Agents**: Data analysis and insights
6. **🔍 Researcher Agents**: Information gathering and analysis
7. **🛡️ Security Agents**: Security auditing and compliance
8. **🚀 DevOps Agents**: Deployment and infrastructure

### Coordination Topologies

#### 1. Mesh Topology (Default)
```
Agent1 ←→ Agent2
  ↕       ↕
Agent4 ←→ Agent3
```
- **Best for**: Collaborative tasks, brainstorming, parallel problem-solving
- **Use cases**: Full-stack development, complex integrations

#### 2. Hierarchical Topology
```
    Queen
   ╱  │  ╲
  A1  A2  A3
     ╱│╲
   A4 A5 A6
```
- **Best for**: Large projects, clear task delegation, structured workflows
- **Use cases**: Enterprise applications, microservices architecture

#### 3. Ring Topology
```
Agent1 → Agent2 → Agent3
  ↑                ↓
Agent5 ← Agent4 ←──╯
```
- **Best for**: Sequential workflows, pipeline processing
- **Use cases**: CI/CD pipelines, data processing workflows

## 🎯 Getting Started - Your First Hive

### Quick Start Commands

```bash
# 1. Initialize Claude Flow (one-time setup)
npx claude-flow@alpha init --force

# 2. Simple task coordination
npx claude-flow@alpha swarm "build me a REST API" --claude

# 3. Advanced hive-mind setup
npx claude-flow@alpha hive-mind wizard
npx claude-flow@alpha hive-mind spawn "build enterprise system" --claude
```

### When to Use Swarm vs Hive-Mind

| Feature | `swarm` Command | `hive-mind` Command |
|---------|----------------|-------------------|
| **Best For** | Quick tasks, single objectives | Complex projects, persistent sessions |
| **Setup** | Instant - no configuration needed | Interactive wizard setup |
| **Session** | Temporary coordination | Persistent with resume capability |
| **Memory** | Task-scoped | Project-wide with SQLite storage |
| **Agents** | Auto-spawned for task | Manual control with specializations |
| **Use When** | "Build X", "Fix Y", "Analyze Z" | Multi-feature projects, team coordination |

## 🛠️ Practical Usage Examples

### 1. Full-Stack Development

```bash
# Deploy complete development swarm
npx claude-flow@alpha hive-mind spawn "Build e-commerce platform with React, Node.js, and PostgreSQL" \
  --agents 10 \
  --strategy parallel \
  --memory-namespace ecommerce

# Monitor progress in real-time
npx claude-flow@alpha swarm monitor --dashboard --real-time
```

### 2. API Development

```bash
# Quick API development
npx claude-flow@alpha swarm "create REST API with authentication, user management, and PostgreSQL" --claude

# Advanced API with specific requirements
npx claude-flow@alpha hive-mind spawn "microservices API with Docker, Redis, and comprehensive testing" \
  --agents 8 \
  --topology hierarchical \
  --claude
```

### 3. Research & Analysis

```bash
# Deploy research swarm with neural enhancement
npx claude-flow@alpha swarm "Research AI safety in autonomous systems" \
  --strategy research \
  --neural-patterns enabled \
  --memory-compression high

# Analyze results with cognitive computing
npx claude-flow@alpha cognitive analyze --target research-results
```

### 4. Security & Compliance

```bash
# Automated security analysis
npx claude-flow@alpha github gh-coordinator analyze --analysis-type security --target ./src
npx claude-flow@alpha hive-mind spawn "security audit and compliance review" --claude
```

## 💾 Memory System

### SQLite-Based Persistence
Claude Flow uses a sophisticated SQLite memory system with 12 specialized tables:

```bash
# Store project context
npx claude-flow@alpha memory store "project-context" "Full-stack app requirements"

# Query memory
npx claude-flow@alpha memory query "authentication" --namespace sparc

# View memory statistics
npx claude-flow@alpha memory stats

# Export/Import memory
npx claude-flow@alpha memory export backup.json --namespace default
npx claude-flow@alpha memory import project-memory.json
```

### Memory Tables Structure
- `swarm_state` - Current hive status and configuration
- `agent_interactions` - Inter-agent communication logs
- `task_history` - Completed tasks and outcomes
- `decision_tree` - Decision-making patterns and rationale
- `performance_metrics` - Execution time, success rates, efficiency
- `neural_patterns` - Learned coordination patterns
- `code_patterns` - Successful code implementations
- `error_patterns` - Common mistakes and their solutions
- `project_context` - Current project state and requirements
- `file_changes` - Tracked file modifications and reasons
- `dependencies` - Project dependencies and relationships
- `documentation` - Generated docs and explanations

## 🧠 Neural Network Capabilities

### Cognitive Computing Features

```bash
# Train coordination patterns
npx claude-flow@alpha neural train --pattern coordination --data "workflow.json"

# Real-time predictions
npx claude-flow@alpha neural predict --model task-optimizer --input "current-state.json"

# Analyze cognitive behavior
npx claude-flow@alpha cognitive analyze --behavior "development-patterns"
```

### 27+ Neural Models Available
- Pattern Recognition
- Adaptive Learning
- Transfer Learning
- Model Compression
- Ensemble Models
- Explainable AI

## 🔧 87 Advanced MCP Tools

### Tool Categories

#### 🐝 Swarm Orchestration (15 tools)
- `swarm_init`, `agent_spawn`, `task_orchestrate`
- `swarm_monitor`, `topology_optimize`, `load_balance`
- `coordination_sync`, `swarm_scale`, `swarm_destroy`

#### 🧠 Neural & Cognitive (12 tools)
- `neural_train`, `neural_predict`, `pattern_recognize`
- `cognitive_analyze`, `learning_adapt`, `neural_compress`

#### 💾 Memory Management (10 tools)
- `memory_usage`, `memory_search`, `memory_persist`
- `memory_namespace`, `memory_backup`, `memory_restore`

#### 📊 Performance & Monitoring (10 tools)
- `performance_report`, `bottleneck_analyze`, `token_usage`
- `benchmark_run`, `metrics_collect`, `trend_analysis`

#### 🔄 Workflow Automation (10 tools)
- `workflow_create`, `workflow_execute`, `workflow_export`
- `automation_setup`, `pipeline_create`, `scheduler_manage`

#### 📦 GitHub Integration (6 tools)
- `github_repo_analyze`, `github_pr_manage`, `github_issue_track`
- `github_release_coord`, `github_workflow_auto`, `github_code_review`

## 🪝 Advanced Hooks System

### Automated Workflow Enhancement
Claude Flow automatically configures hooks for enhanced coordination:

```bash
# Hooks automatically trigger on operations
npx claude-flow@alpha init --force  # Auto-configures MCP servers & hooks
```

### Available Hooks
- **Pre-Operation**: `pre-task`, `pre-search`, `pre-edit`, `pre-command`
- **Post-Operation**: `post-edit`, `post-task`, `post-command`, `notification`
- **Session**: `session-start`, `session-end`, `session-restore`

### Fix Hook Variables (if needed)
```bash
# Fix variable interpolation issues
npx claude-flow@alpha fix-hook-variables
```

## 📊 Performance Metrics

### Industry-Leading Results
- ✅ **84.8% SWE-Bench Solve Rate**: Superior problem-solving through hive-mind coordination
- ✅ **32.3% Token Reduction**: Efficient task breakdown reduces costs significantly
- ✅ **2.8-4.4x Speed Improvement**: Parallel coordination maximizes throughput
- ✅ **87 MCP Tools**: Most comprehensive AI tool suite available
- ✅ **Zero-Config Setup**: Automatic MCP integration with Claude Code

## 🔍 Monitoring and Analytics

### Real-Time Monitoring

```bash
# Monitor hive activity
npx claude-flow@alpha hive monitor --live --interval 2s

# View agent communications
npx claude-flow@alpha hive comms --tail --agent all

# Performance dashboard
npx claude-flow@alpha hive dashboard --web --port 8080
```

### Performance Reports

```bash
# Generate performance report
npx claude-flow@alpha hive report --timeframe 24h --format detailed

# Analyze coordination efficiency
npx claude-flow@alpha hive analyze --metric coordination-efficiency

# View success rates by agent type
npx claude-flow@alpha hive stats --by-agent --metric success-rate
```

## 🛡️ Fault Tolerance & Self-Healing

### Configuration

```bash
# Enable fault tolerance
npx claude-flow@alpha hive config set fault-tolerance enabled

# Configure recovery strategies
npx claude-flow@alpha hive config set recovery-strategy "restart-failed-agents"
npx claude-flow@alpha hive config set max-retries 3
npx claude-flow@alpha hive config set timeout 300s
```

### Health Monitoring

```bash
# Check hive health
npx claude-flow@alpha hive health --comprehensive

# Monitor individual agents
npx claude-flow@alpha agent health --agent all --continuous

# Automated recovery
npx claude-flow@alpha hive recovery --auto --strategy conservative
```

## 🎯 Best Practices

### 1. Choose the Right Topology
- **Mesh**: For collaborative, exploratory tasks
- **Hierarchical**: For large, structured projects
- **Ring**: For sequential, pipeline-based workflows
- **Star**: For simple, centralized coordination

### 2. Optimize Agent Count
- **2-3 agents**: Simple tasks, prototyping
- **4-6 agents**: Medium complexity projects
- **7-12 agents**: Large, complex applications
- **12+ agents**: Enterprise-scale development

### 3. Memory Management
- Store important decisions and rationale
- Regular memory exports for backup
- Clean up old patterns periodically
- Use namespaces for project organization

### 4. Neural Pattern Optimization
- Enable learning for repeated task types
- Review and curate learned patterns
- Export successful patterns for reuse
- Regular pattern validation and updates

## 🚨 Troubleshooting

### Common Issues

1. **Permission Errors**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

2. **Claude Code Not Found**
```bash
# Reinstall Claude Code
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code
claude --dangerously-skip-permissions
```

3. **Memory Database Errors**
```bash
# Reset memory system
npx claude-flow@alpha memory reset --force
npx claude-flow@alpha memory init
```

4. **MCP Server Issues**
```bash
# Restart MCP server
npx claude-flow@alpha mcp restart
```

### WSL2 Specific Issues

1. **SQLite Issues**: Claude Flow automatically falls back to in-memory storage if SQLite fails
2. **File Permissions**: Ensure proper permissions in WSL2 filesystem
3. **Network Issues**: Check WSL2 network configuration for web dashboard access

## 🔮 Advanced Features

### Swarm Evolution
```bash
# Evolve hive based on performance
npx claude-flow@alpha hive evolve --generations 5 --fitness coordination-speed

# Genetic algorithm optimization
npx claude-flow@alpha hive optimize --algorithm genetic --target efficiency
```

### Multi-Hive Coordination
```bash
# Create multiple specialized hives
npx claude-flow@alpha hive create frontend --topology mesh --agents 4
npx claude-flow@alpha hive create backend --topology hierarchical --agents 6

# Coordinate between hives
npx claude-flow@alpha hive coordinate --hives frontend,backend --task "full-stack app"
```

## 📚 Command Reference

### Essential Commands

```bash
# Help and Information
npx claude-flow@alpha --help
npx claude-flow@alpha help <command>

# Hive Management
npx claude-flow@alpha hive-mind wizard
npx claude-flow@alpha hive-mind spawn "task description" --claude
npx claude-flow@alpha hive-mind status
npx claude-flow@alpha hive-mind metrics

# Memory Operations
npx claude-flow@alpha memory store <key> <value>
npx claude-flow@alpha memory query <pattern>
npx claude-flow@alpha memory stats
npx claude-flow@alpha memory export <file>

# Neural Operations
npx claude-flow@alpha neural train --pattern <type>
npx claude-flow@alpha neural predict --model <model>
npx claude-flow@alpha cognitive analyze --behavior <pattern>

# GitHub Integration
npx claude-flow@alpha github gh-coordinator <action>
npx claude-flow@alpha github pr-manager <action>
npx claude-flow@alpha github issue-tracker <action>

# Workflow Management
npx claude-flow@alpha workflow create --name <name>
npx claude-flow@alpha batch process --items <list>
npx claude-flow@alpha pipeline create --config <file>
```

## 🎉 Getting Started Checklist

- [ ] Install Node.js 18+ and npm 9+
- [ ] Install Claude Code globally
- [ ] Activate Claude Code with `--dangerously-skip-permissions`
- [ ] Install Claude Flow Alpha: `npm install -g claude-flow@alpha`
- [ ] Initialize: `claude-flow init`
- [ ] Test basic functionality: `claude-flow --version`
- [ ] Try your first swarm: `npx claude-flow@alpha swarm "create hello world API" --claude`
- [ ] Explore hive-mind: `npx claude-flow@alpha hive-mind wizard`

## 📖 Additional Resources

- **GitHub Repository**: https://github.com/ruvnet/claude-flow
- **NPM Package**: https://www.npmjs.com/package/claude-flow/v/alpha
- **Discord Community**: https://discord.com/invite/dfxmpwkG2D
- **Documentation Wiki**: https://github.com/ruvnet/claude-flow/wiki

## ⚠️ Alpha Disclaimer

This is an alpha release intended for testing and feedback. Use in production environments is not recommended. The software is under active development and features may change.

---

**Built with ❤️ by rUv | Powered by Revolutionary AI**

*v2.0.0 Alpha - The Future of AI Orchestration*
