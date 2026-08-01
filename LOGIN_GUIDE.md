# DealFlow AI - Verified Login Credentials & Portal Guide
Last Updated: 2026-08-01

## 1. Admin Portal (`/portal/admin/login`)
| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `admin@dealflow.ai` | `Admin@123` | `admin` | Full System Access |
| `admin1@dealflow.ai` | `Admin@123` | `admin` | Secondary Admin Account |

## 2. Agent Portal (`/portal/agent/login`)
| Email | Password | Role | Assigned Workspace |
|-------|----------|------|--------------------|
| `praneeth@dealflow.ai` | `Praneeth@123` | `agent` | Primary Operations Agent |
| `agent.ashok@dealflow.ai` | `Ashok@123` | `agent` | Client Support Agent |

## 3. Customer Portal (`/portal/customer/login`)
| Email | Password | Role | Company |
|-------|----------|------|---------|
| `demo@customer.com` | `Demo@123` | `customer` | Demo Customer |
| `praneethburada@gmail.com` | `Praneeth@1909` | `customer` | Praneeth Burada |

## Quickstart Instructions
1. Ensure your local environment server is running: `npm run dev`
2. Navigate to the desired portal login route:
   - **Admin Portal**: [http://localhost:3000/portal/admin/login](http://localhost:3000/portal/admin/login)
   - **Agent Portal**: [http://localhost:3000/portal/agent/login](http://localhost:3000/portal/agent/login)
   - **Customer Portal**: [http://localhost:3000/portal/customer/login](http://localhost:3000/portal/customer/login)
3. Enter the corresponding verified credentials listed above to log in successfully.

