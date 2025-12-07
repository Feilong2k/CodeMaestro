# Environment Contract

**Status:** Active
**Last Updated:** 2025-12-07

This file defines the required infrastructure and configuration for the application. Any changes here must be approved by the Orchestrator (Orion) before implementation code is written.

## 1. Required Infrastructure
| Service | Purpose | Required? | Docker Service Name |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | Primary Database | Yes | `db` |
| **Redis** | (Future) Job Queue | No | `redis` |

## 2. Environment Variables (Runtime)
| Variable | Description | Default / Example | Required? |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment Mode | `development` | Yes |
| `PORT` | API Server Port | `4000` | Yes |
| `DATABASE_URL` | Postgres Connection | `postgresql://user:pass@localhost:5432/db` | Yes |
| `GEMINI_API_KEY` | Strategic AI Model | - | Yes (for AI features) |
| `DEEPSEEK_API_KEY` | Tactical AI Model | - | Yes (for AI features) |

## 3. External Dependencies
| Service | API Host | Purpose |
| :--- | :--- | :--- |
| **Gemini** | `generativelanguage.googleapis.com` | Strategic Planning |
| **DeepSeek** | `api.deepseek.com` | Code Generation |

## 4. Hardware/OS Constraints
*   **OS:** Windows 10/11 (Dev), Linux (Prod)
*   **Node:** v18+
*   **Memory:** 4GB+ recommended

