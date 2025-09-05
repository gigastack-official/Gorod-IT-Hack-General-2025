# ---- Runtime image (jar должен быть собран заранее) ----
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17
WORKDIR /app
COPY backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

## Duplicate stages removed (drop docker.io base images)


