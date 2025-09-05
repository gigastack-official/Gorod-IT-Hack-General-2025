# ---- Build stage ----
    FROM public.ecr.aws/docker/library/gradle:8.10.0-jdk17 AS build
    WORKDIR /app
    # Иногда помогает при сетевых капризах
    ENV GRADLE_OPTS="-Djava.net.preferIPv4Stack=true"
    
    # 1) Кладём только gradle-декларации, чтобы прогреть кэш плагинов/зависимостей
    COPY backend/settings.gradle* backend/build.gradle* ./backend/
    # если нужен gradle.properties, но его нет — создадим пустой (опционально)
    RUN test -f backend/gradle.properties || touch backend/gradle.properties
    
    # Прогрев кэша плагинов/репозиториев (БЕЗ wrapper!)
    RUN gradle -p backend --no-daemon help
    
    # 2) Кладём остальной код и собираем jar
    COPY . .
    RUN gradle -p backend clean bootJar --no-daemon
    
    # ---- Run stage ----
    FROM public.ecr.aws/amazoncorretto/amazoncorretto:17
    WORKDIR /app
    COPY --from=build /app/backend/build/libs/*.jar /app/app.jar
    EXPOSE 8080
    ENTRYPOINT ["java","-jar","/app/app.jar"]
    