# ---- Build stage ----
    FROM public.ecr.aws/docker/library/gradle:8.10.0-jdk17 AS build
    WORKDIR /app
    ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
    
    # 1) Кладём wrapper и конфиги, чтобы прогреть кэш плагинов
    COPY gradlew gradlew.bat ./
    COPY gradle/ ./gradle/
    COPY backend/settings.gradle* backend/build.gradle* ./backend/
    # если gradle.properties отсутствует — создадим пустой
    RUN test -f backend/gradle.properties || touch backend/gradle.properties
    
    # Прогрев кэша (без исходников)
    RUN ./gradlew -p backend --no-daemon help
    
    # 2) Теперь код
    COPY . .
    RUN ./gradlew -p backend clean bootJar --no-daemon
    
    # ---- Run stage ----
    FROM public.ecr.aws/amazoncorretto/amazoncorretto:17
    WORKDIR /app
    COPY --from=build /app/backend/build/libs/*.jar /app/app.jar
    EXPOSE 8080
    ENTRYPOINT ["java","-jar","/app/app.jar"]
    