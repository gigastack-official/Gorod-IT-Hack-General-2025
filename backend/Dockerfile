# ---- Build stage ----
FROM public.ecr.aws/docker/library/openjdk:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew -p backend clean bootJar --no-daemon

# ---- Run stage ----
FROM public.ecr.aws/docker/library/openjdk:17-jre
WORKDIR /app
COPY --from=build /app/backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

## Duplicate stages removed (drop docker.io base images)


