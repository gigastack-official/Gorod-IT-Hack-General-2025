# ---- Build stage ----
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17 AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew -p backend clean bootJar --no-daemon

# ---- Run stage ----
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17
WORKDIR /app
COPY --from=build /app/backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

## Duplicate stages removed (drop docker.io base images)


