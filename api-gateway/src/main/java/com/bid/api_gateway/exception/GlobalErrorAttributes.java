package com.bid.api_gateway.exception;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;

import java.util.Map;

@Component
public class GlobalErrorAttributes extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(ServerRequest request, ErrorAttributeOptions options) {
        Map<String, Object> map = super.getErrorAttributes(request, options);
        Throwable error = getError(request);

        // PRINT STACK TRACE TO CONSOLE
        System.err.println(">>> API GATEWAY ERROR <<<");
        if (error != null) {
            error.printStackTrace();
            map.put("exception", error.getClass().getName());
            map.put("message", error.getMessage());
        }
        return map;
    }
}
