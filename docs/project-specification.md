# Office Care Hub

Build an Office Maintenance & Complaint Management System for INDIAN OIL 

Create a complete, clean, simple and professional internal office web application called Office Maintenance & Complaint Management System (OMCMS).

The application is used by employees to report office problems and by managers to manage, assign, track and resolve those complaints.

1. Technology Requirements

Build the application with:

Frontend

clean ui for professional corporate use

Responsive design for desktop, tablet and mobile

Backend

Node.js

Express.js

REST APIs

Database

PostgreSQL

Use pg / node-postgres for database connectivity

Use SQL queries where appropriate

Authentication

JWT authentication

bcrypt password hashing

Role-based access control

Development

The project should be structured so that the frontend and backend can be separated cleanly.

Keep database credentials and JWT secrets in environment variables.

Do NOT hard-code passwords, database credentials or secret keys.

2. User Roles

There are ONLY TWO application roles:

Employee

Employees can:

Login

Report a problem

View their own complaints

View complaint details

Track complaint status

View assigned maintenance staff

View resolution remarks

Employees must NOT be able to:

View other employees' complaints

Change complaint priority

Assign maintenance staff

Change complaint status

Resolve complaints

Access manager dashboard

Manager

Managers can:

Login

View ALL complaints

View individual complaint details

Assign maintenance staff

Change complaint priority

Filter and monitor complaints

Change complaint status

Add resolution remarks

Mark complaints as resolved

View basic complaint statistics

Maintenance staff DO NOT need their own login in this version. The manager simply selects a maintenance staff member while assigning a complaint.

3. Authentication

Create a login page with:

Email

Password

Login button

Error message for invalid credentials

After login:

Employee → Employee Dashboard

Manager → Manager Dashboard

Use JWT for authentication.

Use bcrypt for securely hashing passwords.

Protect all private routes.

4. Employee Interface

Create a simple employee dashboard.

At the top:

Office Maintenance System

Navigation:

Dashboard

Report Problem

My Complaints

Logout

Employee Dashboard

Show four summary cards:

Total Complaints

Pending

In Progress

Resolved

Below the cards show a "Recent Complaints" table.

Columns:

Complaint ID

Category

Problem

Location

Priority

Status

Date

View

Use simple Bootstrap cards and tables.

Do not make the UI overly fancy.

5. Report Problem Page

Create a form titled:

Report a Problem

Fields:

Category

Dropdown:

Furniture

Computer / IT

Electrical

Plumbing

Cleaning

Other

Problem Type

Dropdown/input depending on selected category.

Examples:

Furniture:

Broken Chair

Broken Table

Cabinet Problem

Drawer Problem

Computer / IT:

Computer Not Working

Monitor Problem

Keyboard / Mouse

Printer Problem

Internet Problem

Electrical:

Light Problem

Fan Problem

AC Problem

Switch / Socket Problem

Plumbing:

Water Leakage

Tap Problem

Washroom Problem

Cleaning:

Room Cleaning

Washroom Cleaning

Garbage Disposal

Location

Text field.

Example:
"3rd Floor - Room 302"

Description

Large textarea.

Priority

Dropdown:

Low

Medium

High

The employee can select the priority while reporting, but the Manager can change it later.

Submit Button

Button text:

Submit Complaint

After successful submission:

Show:

"Complaint submitted successfully."

Generate a unique complaint ID.

Initial status must automatically be:

PENDING

6. My Complaints Page

Display only complaints belonging to the logged-in employee.

Table columns:

Complaint ID

Category

Problem

Location

Priority

Assigned Staff

Status

Submitted Date

View Details

Add filters:

Status

Priority

Category

Add search by Complaint ID.

7. Employee Complaint Details

When an employee opens a complaint, show:

Complaint #101

Information:

Employee Name

Category

Problem Type

Description

Location

Priority

Status

Assigned Maintenance Staff

Submitted Date

Last Updated

Resolution Remarks

Resolved Date

Employees can only VIEW this information.

They cannot edit status, priority, assigned staff or resolution remarks.

8. Manager Interface

Create a separate manager dashboard.

Navigation:

Dashboard

All Complaints

Pending

In Progress

Resolved

Maintenance Staff

Logout

Manager Dashboard

At the top show:

Manager Dashboard

Create summary cards:

Total Complaints

Pending

In Progress

Resolved

High Priority

Below this show recent complaints.

Add a simple chart showing complaints by category if supported.

Categories:

Furniture

Computer / IT

Electrical

Plumbing

Cleaning

Other

Do not make the dashboard visually complicated.

9. Manager - All Complaints

Create a page showing ALL complaints.

Table:

| ID | Employee | Category | Problem | Location | Priority | Assigned Staff | Status | Date | Action |

The manager can:

Search

Filter by status

Filter by priority

Filter by category

Filter by date

Filter by assigned staff

Use Bootstrap dropdowns and tables.

10. Manager Complaint Details

When the manager opens a complaint, show a detailed management page.

Example:

Complaint #101

Employee:
Ayushi

Department:
IT

Category:
Furniture

Problem:
Broken Chair

Description:
Chair wheel is damaged.

Location:
3rd Floor - Room 302

Priority:

[ High ▼ ]

Assigned Maintenance Staff:

[ Ramesh Kumar ▼ ]

Status:

[ Pending ▼ ]

Resolution Remarks:

[ Enter resolution details here ]

Buttons:

Update Complaint

Mark as Resolved

When the manager changes the status to RESOLVED:

Store resolution remarks

Store resolved date/time

Change status to RESOLVED

Make the resolved information visible to the employee

11. Maintenance Staff

Create a simple Manager-only maintenance staff section.

The manager should be able to view maintenance staff such as:

NameDepartmentPhoneRamesh KumarElectricalXXXXXXXXAmit SharmaITXXXXXXXXRaj KumarFurnitureXXXXXXXX

The manager selects a staff member when assigning a complaint.

No maintenance staff login is required.

12. Complaint Status

Use ONLY these three statuses:

PENDING

Complaint submitted but work has not started.

IN_PROGRESS

Complaint has been assigned and work is being handled.

RESOLVED

Problem has been fixed.

Display statuses using clear Bootstrap badges.

Example:

Pending → yellow

In Progress → blue

Resolved → green

13. Priority

Use:

LOW

MEDIUM

HIGH

Display priority using clear visual indicators.

High priority complaints should be easy for the Manager to identify.

14. Complaint History

Maintain a simple history for each complaint.

Example:

Complaint #101

Complaint Submitted — 10:20 AM

Assigned to Ramesh Kumar — 10:45 AM

Status changed to In Progress — 11:00 AM

Status changed to Resolved — 1:15 PM

If a full history table is implemented in the database, display this information on the complaint details page.

15. Database Design

Use PostgreSQL.

Create these main tables:

users

Fields:

id

name

email

password

role

department

created_at

Role values:

EMPLOYEE

MANAGER

complaints

Fields:

id

employee_id

category_id

problem_type

description

location

priority

status

assigned_staff_id

resolution_remarks

created_at

updated_at

resolved_at

categories

Fields:

id

name

Categories:

Furniture

Computer / IT

Electrical

Plumbing

Cleaning

Other

maintenance_staff

Fields:

id

name

department

phone

Use proper primary keys and foreign keys.

Relationships:

users → complaints

categories → complaints

maintenance_staff → complaints

16. API Structure

Create REST APIs approximately like:

Authentication:

POST /api/auth/login

Employee:

POST /api/complaints
GET /api/complaints/my
GET /api/complaints/

Manager:

GET /api/complaints
GET /api/complaints/
PUT /api/complaints//priority
PUT /api/complaints//assign
PUT /api/complaints//status
PUT /api/complaints//resolve

Maintenance Staff:

GET /api/maintenance-staff

Categories:

GET /api/categories

Use proper HTTP status codes and error handling.

17. UI Design

The UI should be:

Simple

Professional

Clean

Corporate

Easy to understand

Responsive

Use Bootstrap 5.

Use:

Navbar/sidebar

Cards

Tables

Forms

Dropdowns

Modals where useful

Bootstrap alerts

Status badges

Simple dashboard cards

Avoid:

Excessive animations

3D effects

Complex gradients

Excessive decorative elements

Unnecessary pages

Overly colorful design

The system is an internal corporate application, so prioritize usability over visual effects.

18. Important Things NOT to Build

Do NOT add:

Image upload

Photo upload

AI

Chatbot

QR codes

Payment

WhatsApp integration

Email notification system

Mobile app

Separate maintenance staff login

Complex real-time notifications

Social login

Unnecessary admin roles

Keep the application focused on complaint management.

19. Error Handling

Show clear messages for:

Invalid login

Missing required fields

Invalid complaint data

Unauthorized access

Complaint not found

Database errors

Failed API requests

Example:

"Invalid email or password."

"Please fill all required fields."

"Complaint submitted successfully."

"Complaint updated successfully."

20. Security Requirements

Implement:

bcrypt password hashing

JWT authentication

Protected API routes

Role-based authorization

Environment variables for secrets

PostgreSQL parameterized queries to prevent SQL injection

Validation of user input

Never expose:

Password hashes

JWT secret

Database password

Other sensitive environment variables

21. Final User Flow

Employee:

Login
→ Dashboard
→ Report Problem
→ Complaint Created
→ Track Complaint
→ View Status
→ View Resolution

Manager:

Login
→ Dashboard
→ View All Complaints
→ Open Complaint
→ Change Priority
→ Assign Maintenance Staff
→ Change Status
→ Add Resolution Remarks
→ Mark Resolved

22. Final Goal

Generate a fully functional prototype of the Office Maintenance & Complaint Management System following the requirements above.

The application should feel like a real internal company maintenance portal, but the UI should remain simple enough for employees to understand immediately.

Prioritize:

Correct functionality

Clean database structure

Secure authentication

Clear employee/manager separation

Easy complaint tracking

Simple professional UI

Do not add unnecessary features outside this specification.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8b77b561-4184-4eb4-9f7d-bd24eb8014bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
