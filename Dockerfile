# Dockerfile for Bus Management System
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY BusManagementSystem/BusManagementSystem.csproj BusManagementSystem/
RUN dotnet restore BusManagementSystem/BusManagementSystem.csproj

# Copy source code and build
COPY BusManagementSystem/ BusManagementSystem/
RUN dotnet publish BusManagementSystem/BusManagementSystem.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 80
EXPOSE 443

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80

# Run the application
ENTRYPOINT ["dotnet", "BusManagementSystem.dll"]