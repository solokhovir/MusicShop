//SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract MusicShop {
    struct Album {
        uint index;
        string uid;
        string title;
        uint price;
        uint quantity;
    }

    struct Order {
        uint orderId;
        string albumUid;
        address customer;
        uint orderedAt;
        OrderStatus status;
    }

    enum OrderStatus { Paid, Delivered }

    Album[] public albums;
    Order[] public orders;

    uint public currentIndex;
    uint public currentOrderId;

    address public owner;

    event AlbumBought(string indexed uid, string rawUid, address indexed customer, uint indexed timestamp);
    event OrderDelivered(string indexed albumUid, address indexed customer);

    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addAlbum(
        string calldata uid, 
        string calldata title,
        uint price,
        uint quantity
    ) external onlyOwner {
        albums.push(Album({
            index: currentIndex,
            uid: uid,
            title: title,
            price: price,
            quantity: quantity
        }));

        currentIndex++;
    }

    function buy(uint _index) external payable {
        Album storage albumToBuy = albums[_index];

        require(msg.value == albumToBuy.price, "invalid price");
        require(albumToBuy. quantity > 0, "out of stock!");

        albumToBuy.quantity--;

        orders.push(Order({
            orderId: currentOrderId,
            albumUid: albumToBuy.uid,
            customer: msg.sender,
            orderedAt: block.timestamp,
            status: OrderStatus.Paid
        }));

        currentOrderId++;

        emit AlbumBought(albumToBuy.uid, albumToBuy.uid, msg.sender, block.timestamp);
    }

    function delivered(uint _index) external onlyOwner {
        Order storage cOrder = orders[_index];

        require(cOrder.status != OrderStatus.Delivered, "invalid status!");

        cOrder.status = OrderStatus.Delivered;

        emit OrderDelivered(cOrder.albumUid, cOrder.customer);
    }

    receive() external payable {
        revert("Please use the buy function to purchase albums!");
    }

    function allAlbums() external view returns(Album[] memory) {
        Album[] memory albumsList = new Album[](albums.length);

        for (uint i = 0; i < albums.length; i++) {
            albumsList[i] = albums[i];
        }

        return albumsList;
    }

}