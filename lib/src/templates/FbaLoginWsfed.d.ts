export declare const template = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n  <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n    <soap:Body>\n      <Login xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\">\n        <username><%= username %></username>\n        <password><%= password %></password>\n      </Login>\n    </soap:Body>\n  </soap:Envelope>\n";