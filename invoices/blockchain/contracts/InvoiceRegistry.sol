// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InvoiceRegistry {
    // Incremental invoice id
    uint256 private _nextInvoiceId = 1;

    // Mapping from invoice id to invoice hash
    mapping(uint256 => bytes32) public invoices;

    // Event emitted when an invoice is registered
    event InvoiceRegistered(address indexed business, bytes32 indexed invoiceHash, uint256 timestamp);

    /// @notice Register an invoice hash and receive an invoice id
    /// @param invoiceHash The keccak256 (or other) hash representing the invoice
    /// @return invoiceId The id assigned to the registered invoice
    function registerInvoice(bytes32 invoiceHash) public returns (uint256 invoiceId) {
        require(invoiceHash != bytes32(0), "invoiceHash cannot be zero");

        invoiceId = _nextInvoiceId;
        invoices[invoiceId] = invoiceHash;
        _nextInvoiceId += 1;

        emit InvoiceRegistered(msg.sender, invoiceHash, block.timestamp);
        return invoiceId;
    }

    /// @notice Get invoice hash by id
    /// @param invoiceId The invoice id
    /// @return invoiceHash The registered invoice hash
    function getInvoice(uint256 invoiceId) public view returns (bytes32 invoiceHash) {
        return invoices[invoiceId];
    }
}
