package com.kimtan.employeemanagement.mapper;

import com.kimtan.employeemanagement.model.dto.DocumentDto;
import com.kimtan.employeemanagement.model.entity.Document;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface DocumentMapper {
    @Mapping(source = "employee.id", target = "employeeId")
    DocumentDto toDto(Document document);
    
    List<DocumentDto> toDtoList(List<Document> documents);
}
