# ProjKomp
## docker setup
### auth:  
(from /ProjKompBFF dir)  
**docker build -t classplan-auth .**  
**docker run --env-file .env.local -p 3001:3001 classplan-auth**

### frontend:  
(from /ProjKompFrontEnd dir)  
**docker build -t classplan-front .**  
**docker run -p 5173:80 classplan-front**  