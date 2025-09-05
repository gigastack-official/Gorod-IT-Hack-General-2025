# ---- Build stage (используем образ с предустановленным Gradle) ----
FROM public.ecr.aws/docker/library/gradle:8.10.0-jdk17 AS build
WORKDIR /app
COPY gradlew gradlew.bat ./
COPY gradle/ ./gradle/
COPY backend/settings.gradle* backend/gradle.properties ./backend/
RUN ./gradlew -p backend --no-daemon help

COPY . .
ENV GRADLE_OPTS="-Djava.net.preferIPv4Stack=true"
RUN gradle -p backend clean bootJar --no-daemon

# ---- Run stage ----
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17
WORKDIR /app
COPY --from=build /app/backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

## Duplicate stages removed (drop docker.io base images)


